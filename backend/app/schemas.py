from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import models # Import models to use models.PyObjectId and other models for type hinting

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    user_type: str  # "player" or "org"
    bio: Optional[str] = None
    location: Optional[str] = None
    socials: Optional[dict] = None
    games: Optional[List[str]] = None

    class Config:
        validate_by_name = True

class UserOut(BaseModel):
    id: str # This will be the string ID from the helper
    username: str
    email: EmailStr
    user_type: str
    bio: Optional[str] = None
    location: Optional[str] = None
    socials: Optional[dict] = None
    games: Optional[List[str]] = None
    # New fields for profile customization
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None

    class Config:
        validate_by_name = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    socials: Optional[dict] = None
    games: Optional[List[str]] = None
    # New fields for profile customization
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None

    class Config:
        validate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        validate_by_name = True

# Gig schemas
class GigCreate(BaseModel):
    title: str
    description: str
    location: str
    game: Optional[str] = None
    budget: Optional[float] = None
    skills_required: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    status: Optional[str] = "open"

    class Config:
        validate_by_name = True

class GigOut(GigCreate): # Inherit from GigCreate
    id: str # This will be the string ID from the helper
    creator_id: str # Org ID as string
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # applicant_count: Optional[int] = 0 # This field is not directly from the Gig model

    class Config:
        validate_by_name = True

class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    game: Optional[str] = None
    budget: Optional[float] = None
    skills_required: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

    class Config:
        validate_by_name = True

# Application schemas
class ApplicationCreate(BaseModel):
    gig_id: str # gig ID
    cover_letter: Optional[str] = None # application cover letter

    class Config:
        validate_by_name = True

# Endorsement schemas
class EndorsementCreate(BaseModel):
    endorsed_id: str # Player ID as string
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    comment: Optional[str] = None

    class Config:
        validate_by_name = True

# Message schemas
class MessageCreate(BaseModel):
    conversation_id: str
    text: str

    class Config:
        validate_by_name = True

class ConversationCreate(BaseModel):
    recipient_id: str

    class Config:
        validate_by_name = True

class ConversationOut(BaseModel):
    id: str
    participants: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        validate_by_name = True

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    text: str
    created_at: datetime
    read_by: List[str]

    class Config:
        validate_by_name = True
