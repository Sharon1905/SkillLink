from fastapi import APIRouter, HTTPException, Depends, Query, status
from database import db
from schemas import EndorsementCreate
from auth import get_current_user # Import get_current_user from auth
import models # Import models module
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from typing import Optional

router = APIRouter()

# ORG: Endorse a player
@router.post("/endorse")
async def endorse_user(endorsement: EndorsementCreate, current_user: models.User = Depends(get_current_user)):
    if current_user["id"] == endorsement.endorsed_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't endorse yourself.")

    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can endorse players.")

    try:
        endorsed_object_id = ObjectId(endorsement.endorsed_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Endorsed User ID format.")

    endorse_dict = endorsement.model_dump()
    endorse_dict["endorsed_id"] = endorsed_object_id
    endorse_dict["endorsed_by"] = ObjectId(current_user["id"])
    endorse_dict["created_at"] = datetime.now(timezone.utc)
    
    new_endorse = await db["endorsements"].insert_one(endorse_dict)
    created_endorsement = await db["endorsements"].find_one({"_id": new_endorse.inserted_id})
    return models.endorsement_helper(created_endorsement)

# ANYONE: View endorsements of a user (usually player)
@router.get("/endorsements/{user_id}")
async def view_endorsements(
    user_id: str,
    page: int = 1,
    limit: int = 10,
    endorsed_by: Optional[str] = Query(None),
    min_rating: Optional[int] = Query(None),
    max_rating: Optional[int] = Query(None),
    created_before: Optional[str] = Query(None),
    created_after: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc")
):
    if page < 1 or limit < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page and limit must be positive integers.")

    try:
        user_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format.")

    query_filter = {"endorsed_id": user_object_id}

    if endorsed_by:
        try:
            endorsed_by_object_id = ObjectId(endorsed_by)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Endorsed By User ID format.")
        query_filter["endorsed_by"] = endorsed_by_object_id
    if min_rating is not None:
        query_filter.setdefault("rating", {})["$gte"] = min_rating
    if max_rating is not None:
        query_filter.setdefault("rating", {})["$lte"] = max_rating
    if created_before:
        try:
            query_filter.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(created_before)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid created_before date format.")
    if created_after:
        try:
            query_filter.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(created_after)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid created_after date format.")

    allowed_sort_fields = {"created_at", "rating"}
    if sort_by not in allowed_sort_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid sort field: {sort_by}")

    sort_order = -1 if order.lower() == "desc" else 1

    total = await db["endorsements"].count_documents(query_filter)
    cursor = db["endorsements"].find(query_filter).sort(sort_by, sort_order).skip((page - 1) * limit).limit(limit)

    endorsements_list = await cursor.to_list(length=limit)
    
    return {
        "page": page,
        "limit": limit,
        "count": len(endorsements_list),
        "total": total,
        "results": [models.endorsement_helper(e) for e in endorsements_list] # Use helper for formatting
    }

# ORG: Delete own endorsement
@router.delete("/endorsements/{endorsement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_endorsement(endorsement_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        endorsement_object_id = ObjectId(endorsement_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Endorsement ID format.")

    endorsement = await db["endorsements"].find_one({"_id": endorsement_object_id})
    if not endorsement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endorsement not found.")

    if str(endorsement["endorsed_by"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own endorsements.")

    await db["endorsements"].delete_one({"_id": endorsement_object_id})
    return {"message": "Endorsement deleted successfully."}
