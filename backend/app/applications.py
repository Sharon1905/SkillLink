from fastapi import APIRouter, HTTPException, Depends, Query, status
from db.database import db
from schemas import ApplicationCreate
import models # Import models module
from users import get_current_user # Only import get_current_user from users
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone # Import timezone
from typing import List, Optional # Ensure List and Optional are imported

router = APIRouter()

# format application for response
def application_serializer(application) -> dict:
    return models.application_helper(application)

# apply to a gig
@router.post("/apply")
async def apply_to_gig(application: ApplicationCreate, current_user: models.User = Depends(get_current_user)):
    if current_user["user_type"] != "player":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only players can apply to gigs.")

    try:
        gig_object_id = ObjectId(application.gig_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format.")

    gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")

    existing = await db["applications"].find_one({
        "gig_id": gig_object_id,
        "player_id": ObjectId(current_user["id"]),
        "status": {"$ne": "rejected"}
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already applied to this gig.")

    app_dict = application.model_dump()
    app_dict["gig_id"] = gig_object_id
    app_dict["player_id"] = ObjectId(current_user["id"])
    app_dict["status"] = "pending"
    app_dict["created_at"] = datetime.now(timezone.utc)
    app_dict["updated_at"] = datetime.now(timezone.utc)

    new_app = await db["applications"].insert_one(app_dict)
    created_app = await db["applications"].find_one({"_id": new_app.inserted_id})
    return application_serializer(created_app)


# ORG: View applications for a gig (by gig_id)
@router.get("/applications/{gig_id}", response_model=List[models.Application])
async def view_applications(gig_id: str, current_user: models.User = Depends(get_current_user)):
    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can view applications.")

    try:
        gig_object_id = ObjectId(gig_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Gig ID format.")

    gig = await db["gigs"].find_one({"_id": gig_object_id})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")

    if str(gig["creator_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view applications for this gig.")

    applications_cursor = db["applications"].find({"gig_id": gig_object_id})
    applications_list = await applications_cursor.to_list(length=1000)
    
    result_applications = []
    for app in applications_list:
        serialized_app = application_serializer(app) # Serialize the basic app data first
        
        # Now fetch and attach player and gig details for this specific app
        player = await db["users"].find_one({"_id": app["player_id"]})
        if player:
            serialized_app["player"] = models.user_helper(player)
        
        gig = await db["gigs"].find_one({"_id": app["gig_id"]})
        if gig:
            serialized_app["gig"] = models.gig_helper(gig)[0] # gig_helper returns list, take first
        
        # Fetch creator (organization) details for the gig
        creator = None
        if gig and gig.get("creator_id"):
            creator = await db["users"].find_one({"_id": ObjectId(gig["creator_id"])})
            if creator:
                serialized_app["creator"] = models.user_helper(creator) # Add creator details
        
        result_applications.append(serialized_app)

    return result_applications


# PLAYER/ORG: Get a single application by its ID
@router.get("/application/{application_id}", response_model=models.Application)
async def get_application_details(application_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        app_object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Application ID format.")

    application = await db["applications"].find_one({"_id": app_object_id})
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Authorization: Must be the player who applied OR the org who owns the gig
    gig = await db["gigs"].find_one({"_id": application["gig_id"]})
    
    is_owner_player = str(application["player_id"]) == str(current_user["id"])
    is_owner_org = gig and str(gig["creator_id"]) == str(current_user["id"])

    if not (is_owner_player or is_owner_org):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this application.")
    
    serialized_app = application_serializer(application)
    
    # Fetch player details
    player = await db["users"].find_one({"_id": application["player_id"]})
    if player:
        serialized_app["player"] = models.user_helper(player) # Use user_helper for consistency
    
    # Fetch gig details
    if gig:
        serialized_app["gig"] = models.gig_helper(gig)[0] # gig_helper returns list, take first
    
    return serialized_app

# PLAYER: Update own application
@router.patch("/application/{application_id}", response_model=models.Application)
async def update_application(application_id: str, update: dict, current_user: models.User = Depends(get_current_user)):
    # flexible update structure
    # status updates restricted to orgs
    if "status" in update and current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can change application status.")

    try:
        app_object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Application ID format.")

    application = await db["applications"].find_one({"_id": app_object_id})
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Get the associated gig
    gig = await db["gigs"].find_one({"_id": application["gig_id"]})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated gig not found.")

    # Authorization: Must be either the player who applied or the org who posted the gig
    is_player = str(application["player_id"]) == str(current_user["id"])
    is_org = str(gig["creator_id"]) == str(current_user["id"])
    
    if not (is_player or is_org):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own applications or applications for your gigs.")
        
    # Only organizations can update status
    if "status" in update and not is_org:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can change application status.")
        
    # Only players can update cover letter
    if "cover_letter" in update and not is_player:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only players can update the cover letter.")

    update_data = {k: v for k, v in update.items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db["applications"].update_one({"_id": app_object_id}, {"$set": update_data})
    updated_app = await db["applications"].find_one({"_id": app_object_id})
    
    # If the application is being accepted, also update the gig status to "accepted"
    if "status" in update and update["status"] == "accepted":
        await db["gigs"].update_one(
            {"_id": application["gig_id"]}, 
            {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc)}}
        )
    
    return models.application_helper(updated_app)


# PLAYER: Cashout for completed gigs
@router.post("/applications/{application_id}/cashout", response_model=dict)
async def cashout_application(application_id: str, current_user: models.User = Depends(get_current_user)):
    """Process cashout for a completed gig"""
    if current_user["user_type"] != "player":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only players can request cashouts.")

    try:
        app_object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Application ID format.")

    application = await db["applications"].find_one({"_id": app_object_id})
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Check if the player owns this application
    if str(application["player_id"]) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cashout your own applications.")

    # Get the associated gig
    gig = await db["gigs"].find_one({"_id": application["gig_id"]})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated gig not found.")

    # Check if the application is accepted and gig is completed
    if application["status"] != "accepted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only cashout accepted applications.")

    if gig["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only cashout for completed gigs.")

    # Check if already cashed out
    if application.get("cashed_out"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This application has already been cashed out.")

    # Update application to mark as cashed out
    await db["applications"].update_one(
        {"_id": app_object_id}, 
        {"$set": {"cashed_out": True, "cashout_date": datetime.now(timezone.utc)}}
    )

    return {
        "message": "Cashout request submitted successfully",
        "application_id": str(application_id),
        "amount": gig.get("budget", 0),
        "payment_method": gig.get("method", "Not specified"),
        "cashout_date": datetime.now(timezone.utc).isoformat()
    }


# PLAYER/ORG: Delete an application
@router.delete("/application/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application_by_id(application_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        app_object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Application ID format.")

    application = await db["applications"].find_one({"_id": app_object_id})
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Authorization: Must be the player who applied OR the org who owns the gig
    gig = await db["gigs"].find_one({"_id": application["gig_id"]})
    
    is_owner_player = str(application["player_id"]) == str(current_user["id"])
    is_owner_org = gig and str(gig["creator_id"]) == str(current_user["id"])

    if not (is_owner_player or is_owner_org):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete this application.")

    delete_result = await db["applications"].delete_one({"_id": app_object_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found or already deleted.")
    return

# PLAYER: View own applications with gig info (existing endpoint, just ensure correct helpers)
@router.get("/my_applications", response_model=List[models.Application])
async def get_my_applications(current_user: models.User = Depends(get_current_user)):
    if current_user["user_type"] != "player":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only players can view their own applications.")

    applications_cursor = db["applications"].find({"player_id": ObjectId(current_user["id"])})
    applications_list = await applications_cursor.to_list(length=1000)

    result_applications = []
    for app in applications_list:
        serialized_app = application_serializer(app) # Serialize the basic app data first
        
        # Now fetch and attach player and gig details for this specific app
        player = await db["users"].find_one({"_id": app["player_id"]})
        if player:
            serialized_app["player"] = models.user_helper(player)
        
        gig = await db["gigs"].find_one({"_id": app["gig_id"]})
        if gig:
            serialized_app["gig"] = models.gig_helper(gig)[0] # gig_helper returns list, take first
        
        # Fetch creator (organization) details for the gig
        creator = None
        if gig and gig.get("creator_id"):
            creator = await db["users"].find_one({"_id": ObjectId(gig["creator_id"])})
            if creator:
                serialized_app["creator"] = models.user_helper(creator) # Add creator details
        
        result_applications.append(serialized_app)

    return result_applications