from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from db.database import db
from schemas import UserCreate, UserOut, UserLogin, UserUpdate
from auth import hash_password, verify_password, create_access_token, get_current_user
import models # Import the models module
from bson import ObjectId
from bson.errors import InvalidId
import shutil
from pathlib import Path
from datetime import datetime, timezone

router = APIRouter()

# Define the directory for uploads (relative to where main.py is run)
UPLOAD_DIRECTORY = Path("uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True) # Create directory if it doesn't exist

@router.post("/register", response_model=UserOut)
async def register_user(user: UserCreate):
    user_exists = await db["users"].find_one({"email": user.email})
    if user_exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")
    
    user_dict = user.model_dump()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
    # Add default created_at if not provided by the model (though models.User has default_factory)
    if "created_at" not in user_dict:
        user_dict["created_at"] = datetime.now(timezone.utc)
    new_user = await db["users"].insert_one(user_dict)
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    return models.user_helper(created_user)

@router.post("/login")
async def login(user: UserLogin):
    user_from_db = await db["users"].find_one({"email": user.email})
    if not user_from_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if not verify_password(user.password, user_from_db["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password.")
    
    token = create_access_token({"id": str(user_from_db["_id"]), "email": user_from_db["email"], "user_type": user_from_db["user_type"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: models.User = Depends(get_current_user)):
    # Fetch complete user details from database
    user = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return models.user_helper(user)

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user_profile(user_id: str):
    try:
        user_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid User ID format")

    user = await db["users"].find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    return models.user_helper(user)

@router.get("/orgs/{org_id}", response_model=UserOut)
async def get_org_profile(org_id: str):
    try:
        org_object_id = ObjectId(org_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Org ID format")

    user = await db["users"].find_one({"_id": org_object_id})
    if not user or user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    return models.user_helper(user)

@router.post("/upload-profile-picture", response_model=dict)
async def upload_profile_picture(current_user: models.User = Depends(get_current_user), file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed.")

    file_extension = file.filename.split(".")[-1]
    file_name = f"{current_user['id']}_profile.{file_extension}"
    file_path = UPLOAD_DIRECTORY / file_name

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not upload file: {e}")
    finally:
        file.file.close()

    file_url = f"http://127.0.0.1:8000/uploads/{file_name}"
    
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"profile_picture_url": file_url}}
    )

    return {"message": "File uploaded successfully", "file_url": file_url}


@router.patch("/me", response_model=UserOut)
async def update_my_profile(update: UserUpdate, current_user: models.User = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

    if "profile_picture_url" in update_data:
        if not update_data["profile_picture_url"]:
            update_data["profile_picture_url"] = None
    
    if "games" in update_data and isinstance(update_data["games"], str):
        update_data["games"] = [g.strip() for g in update_data["games"].split(',') if g.strip()]
        
    if "socials" in update_data and isinstance(update_data["socials"], dict):
        cleaned_socials = {k: v for k, v in update_data["socials"].items() if v}
        update_data["socials"] = cleaned_socials if cleaned_socials else None

    result = await db["users"].update_one({"_id": ObjectId(current_user["id"])}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile not updated. No changes made.")
    # Ensure we get the latest data after update
    updated_user = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found after update.")
    return models.user_helper(updated_user)

@router.get("/admin/stats")
async def get_admin_stats():
    users_total = await db["users"].count_documents({})
    players = await db["users"].count_documents({"user_type": "player"})
    orgs = await db["users"].count_documents({"user_type": "org"})
    gigs = await db["gigs"].count_documents({})
    applications = await db["applications"].count_documents({})
    endorsements = await db["endorsements"].count_documents({})
    nfts = await db["soulbound_nfts"].count_documents({})

    return {
        "users_total": users_total,
        "players": players,
        "orgs": orgs,
        "gigs": gigs,
        "applications": applications,
        "endorsements": endorsements,
        "nfts_minted": nfts
    }
