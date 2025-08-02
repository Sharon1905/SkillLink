from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from db.database import db
import models # Import models module
from users import get_current_user
from schemas import GigCreate, GigUpdate, GigOut # Correct: GigCreate and GigUpdate are from schemas

router = APIRouter()

# Helper function to convert MongoDB result to Gig model (if needed elsewhere)
def gig_serializer(gig) -> dict:
    return {
        "id": str(gig["_id"]),
        "title": gig["title"],
        "description": gig.get("description"), # Use .get()
        "location": gig.get("location"), # Use .get()
        "tags": gig.get("tags", []),
        "creator_id": str(gig.get("creator_id")), # Use .get() and convert to str
        "game": gig.get("game"),
        "budget": gig.get("budget"),
        "method": gig.get("method"),
        "skills_required": gig.get("skills_required", []),
        "deadline": gig.get("deadline").isoformat() if gig.get("deadline") else None,
        "status": gig.get("status"),
        "created_at": gig.get("created_at").isoformat() if gig.get("created_at") else None,
        "updated_at": gig.get("updated_at").isoformat() if gig.get("updated_at") else None,
    }

# --- GET ENDPOINTS ---

@router.get("/gigs", response_model=List[GigOut]) # Response model is GigOut from schemas
async def browse_gigs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    tags: Optional[List[str]] = None,
    game: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    status: Optional[str] = "active"
):
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if tags:
        query["tags"] = {"$all": tags}
    if game:
        query["game"] = {"$regex": game, "$options": "i"}
    if min_budget is not None or max_budget is not None:
        query["budget"] = {}
        if min_budget is not None:
            query["budget"]["$gte"] = min_budget
        if max_budget is not None:
            query["budget"]["$lte"] = max_budget
    if status:
        query["status"] = status

    gigs_cursor = db["gigs"].find(query)
    gigs = await gigs_cursor.to_list(length=1000)
    return models.gig_helper(gigs)

@router.get("/gigs/{gig_id}", response_model=GigOut) # Response model is GigOut from schemas
async def get_gig_details(gig_id: str):
    try:
        gig_object_id = ObjectId(gig_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format")

    gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
    return gig_serializer(gig)

@router.get("/my_gigs", response_model=List[GigOut]) # Response model is GigOut from schemas
async def get_my_gigs(current_user: models.User = Depends(get_current_user)):
    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can view their own gigs")
    
    gigs_cursor = db["gigs"].find({"creator_id": ObjectId(current_user["id"])}) # Use current_user["id"]
    gigs = await gigs_cursor.to_list(length=1000)
    
    return models.gig_helper(gigs)

# --- POST ENDPOINTS ---

@router.post("/gigs", response_model=GigOut) # Use GigOut from schemas
async def create_gig(gig: GigCreate, current_user: models.User = Depends(get_current_user)): # GigCreate from schemas
    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can create gigs")

    # Check if organization has sufficient balance to lock funds
    if gig.budget and gig.budget > 0:
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        if not wallet or wallet["balance"] < gig.budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Insufficient wallet balance. Required: ${gig.budget:.2f}, Available: ${wallet['balance'] if wallet else 0:.2f}"
            )

    gig_dict = gig.model_dump()
    gig_dict["creator_id"] = ObjectId(current_user["id"])
    gig_dict["created_at"] = datetime.now(timezone.utc)
    gig_dict["updated_at"] = datetime.now(timezone.utc)
    gig_dict["status"] = "active" # Default status

    new_gig = await db["gigs"].insert_one(gig_dict)
    created_gig = await db["gigs"].find_one({"_id": new_gig.inserted_id})
    
    # Lock funds for the gig
    if gig.budget and gig.budget > 0:
        await db["wallets"].update_one(
            {"user_id": ObjectId(current_user["id"])},
            {
                "$inc": {"balance": -gig.budget, "locked_balance": gig.budget},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        # Create transaction record
        transaction_data = {
            "wallet_id": wallet["_id"],
            "user_id": ObjectId(current_user["id"]),
            "transaction_type": "lock",
            "amount": gig.budget,
            "description": f"Locked ${gig.budget:.2f} for gig: {gig.title}",
            "reference_id": str(new_gig.inserted_id),
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(transaction_data)
    
    return gig_serializer(created_gig)

# --- PATCH ENDPOINTS ---

@router.patch("/gigs/{gig_id}", response_model=GigOut) # Use GigOut from schemas
async def update_gig(gig_id: str, gig_update: GigUpdate, current_user: models.User = Depends(get_current_user)): # GigUpdate from schemas
    try:
        gig_object_id = ObjectId(gig_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format")

    existing_gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not existing_gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    if str(existing_gig["creator_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to update this gig")

    update_data = {k: v for k, v in gig_update.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db["gigs"].update_one({"_id": gig_object_id}, {"$set": update_data})
    updated_gig = await db["gigs"].find_one({"_id": gig_object_id})
    return gig_serializer(updated_gig)

# --- DELETE ENDPOINTS ---

@router.delete("/gigs/{gig_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gig(gig_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        gig_object_id = ObjectId(gig_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format")

    existing_gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not existing_gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    if str(existing_gig["creator_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete this gig")

    delete_result = await db["gigs"].delete_one({"_id": gig_object_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found or already deleted")
    return

# --- COMPLETION ENDPOINTS ---

@router.patch("/gigs/{gig_id}/complete", response_model=GigOut)
async def complete_gig(gig_id: str, current_user: models.User = Depends(get_current_user)):
    """Mark a gig as completed"""
    try:
        gig_object_id = ObjectId(gig_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format")

    existing_gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not existing_gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    if str(existing_gig["creator_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to complete this gig")

    # Check if the gig has an accepted application
    accepted_application = await db["applications"].find_one({
        "gig_id": gig_object_id,
        "status": "accepted"
    })
    
    if not accepted_application:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot complete gig without an accepted application")

    update_data = {
        "status": "completed",
        "updated_at": datetime.now(timezone.utc)
    }

    await db["gigs"].update_one({"_id": gig_object_id}, {"$set": update_data})
    updated_gig = await db["gigs"].find_one({"_id": gig_object_id})
    return gig_serializer(updated_gig)