from fastapi import APIRouter, HTTPException, Query, status, Depends
from db.database import db
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
import models # Import models
from users import get_current_user # Import get_current_user

router = APIRouter()

@router.post("/mint_soulbound_nft", response_model=models.SoulboundNFT)
async def mint_nft(user_id: str = Query(...), current_user: models.User = Depends(get_current_user)):
    if current_user["user_type"] != "player" or str(current_user["id"]) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only mint NFT for yourself or as a player.")

    try:
        user_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format.")

    user = await db["users"].find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    existing_nft = await db["soulbound_nfts"].find_one({"user_id": user_object_id})
    if existing_nft:
        return models.soulbound_nft_helper(existing_nft)

    endorsements_cursor = db["endorsements"].find({"endorsed_id": user_object_id})
    endorsements = await endorsements_cursor.to_list(length=1000)

    if len(endorsements) < 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough endorsements to mint NFT (requires at least 3).")

    avg_rating = sum(e["rating"] for e in endorsements) / len(endorsements)
    
    if avg_rating >= 4.7:
        reputation = "Gold SkillLink Talent"
    elif avg_rating >= 4.3:
        reputation = "Silver SkillLink Talent"
    elif avg_rating >= 4.0:
        reputation = "Bronze SkillLink Talent"
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Average rating too low to mint NFT (requires at least 4.0).")

    nft_data = {
        "user_id": user_object_id,
        "name": user.get("username"),
        "reputation": reputation,
        "minted_at": datetime.now(timezone.utc)
    }

    new_nft = await db["soulbound_nfts"].insert_one(nft_data)
    created_nft = await db["soulbound_nfts"].find_one({"_id": new_nft.inserted_id})
    
    return {
        "message": "Soulbound NFT minted!",
        "nft": models.soulbound_nft_helper(created_nft)
    }

@router.get("/nft/{user_id}", response_model=models.SoulboundNFT)
async def get_nft(user_id: str):
    try:
        user_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format.")

    nft = await db["soulbound_nfts"].find_one({"user_id": user_object_id})
    if not nft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NFT not minted for this user.")
    
    return models.soulbound_nft_helper(nft)
