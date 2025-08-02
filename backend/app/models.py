from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from bson import ObjectId
from pydantic_core import core_schema


# Helper class for MongoDB ObjectId handling with Pydantic V2
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: Any
    ) -> core_schema.CoreSchema:
        field_schema = handler(core_schema)
        field_schema['type'] = 'string'
        field_schema['example'] = '60e1234567890abcdef123456'
        return field_schema

# --- Core Application Models (Used by FastAPI Endpoints) ---

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id") # Optional for creation, required for output
    username: str
    email: EmailStr
    user_type: str # "player" or "org"
    bio: Optional[str] = None
    location: Optional[str] = None
    socials: Optional[Dict[str, str]] = None
    discord_id: Optional[str] = None
    wallet_address: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None

    hashed_password: Optional[str] = None

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "id": "60e1234567890abcdef123456",
                "username": "testuser",
                "email": "test@example.com",
                "user_type": "player",
                "bio": "A passionate gamer.",
                "location": "Online",
                "socials": {"twitter": "@testuser"},
                "games": ["Valorant", "CS2"],
                "phone_number": "123-456-7890",
                "profile_picture_url": "https://example.com/pfp.jpg"
            }
        }

class Gig(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    title: str
    description: str
    location: str
    tags: Optional[List[str]] = []
    creator_id: Optional[PyObjectId] = None # Org ID
    game: Optional[str] = None
    budget: Optional[float] = None
    method: Optional[str] = None  # Payment method (e.g., "upi", "card", "bank_transfer")
    skills_required: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    status: Optional[str] = "active"  # "active", "accepted", "completed", "closed"
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "id": "60e1234567890abcdef123456",
                "title": "Valorant Pro Player",
                "description": "Looking for a high-ranked Valorant player.",
                "location": "Remote",
                "tags": ["Valorant", "FPS"],
                "creator_id": "60e1234567890abcdef123456",
                "game": "Valorant",
                "budget": 500.00,
                "skills_required": ["Immortal+", "Teamwork"],
                "deadline": "2025-12-31T23:59:59Z",
                "status": "active"
            }
        }

class GigCreate(BaseModel):
    title: str
    description: str
    location: str
    game: Optional[str] = None
    budget: Optional[float] = None
    method: Optional[str] = None  # Payment method
    skills_required: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    status: Optional[str] = "open"

class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    game: Optional[str] = None
    budget: Optional[float] = None
    method: Optional[str] = None  # Payment method
    skills_required: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class Application(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    gig_id: PyObjectId
    player_id: PyObjectId
    cover_letter: Optional[str] = None
    status: str = "pending"
    cashed_out: Optional[bool] = False
    cashout_date: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Endorsement(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    endorsed_id: PyObjectId
    endorsed_by: PyObjectId # Org ID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SoulboundNFT(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: PyObjectId
    name: str
    reputation: str
    minted_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Team(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    name: str
    description: Optional[str] = None
    captain_id: PyObjectId
    members: List[PyObjectId] = []
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Wallet(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: PyObjectId
    balance: float = 0.0
    locked_balance: float = 0.0  # For orgs: locked in gigs, for players: pending payments
    total_earned: float = 0.0  # For players only
    total_spent: float = 0.0   # For orgs only
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WalletTransaction(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    wallet_id: PyObjectId
    user_id: PyObjectId
    transaction_type: str  # "deposit", "withdrawal", "lock", "unlock", "payment"
    amount: float
    description: Optional[str] = None
    reference_id: Optional[str] = None  # gig_id, application_id, etc.
    status: str = "pending"  # "pending", "completed", "failed"
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Sponsor(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    name: str
    org_id: PyObjectId
    verified: bool = False
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# --- Helper Functions for Data Serialization (Consistent Naming) ---

def user_helper(user_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user_data["_id"]),
        "username": user_data.get("username"),
        "email": user_data.get("email"),
        "user_type": user_data.get("user_type"),
        "bio": user_data.get("bio"),
        "location": user_data.get("location"),
        "socials": user_data.get("socials"),
        "games": user_data.get("games"),
        "phone_number": user_data.get("phone_number"),
        "profile_picture_url": user_data.get("profile_picture_url")
    }

def gig_helper(gigs_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Helper function to transform gig data from MongoDB format to a more usable dictionary format.
    Ensures _id is converted to 'id' and handles missing optional fields.
    """
    if not isinstance(gigs_data, list):
        gigs_data = [gigs_data]

    result = []
    for gig in gigs_data:
        result.append({
            "id": str(gig["_id"]),
            "title": gig.get("title"),
            "description": gig.get("description"),
            "location": gig.get("location"),
            "tags": gig.get("tags", []),
            "creator_id": str(gig.get("creator_id")),
            "game": gig.get("game"),
            "budget": gig.get("budget"),
            "method": gig.get("method"),
            "skills_required": gig.get("skills_required", []),
            "deadline": gig.get("deadline").isoformat() if gig.get("deadline") else None,
            "status": gig.get("status"),
            "created_at": gig.get("created_at").isoformat() if gig.get("created_at") else None,
            "updated_at": gig.get("updated_at").isoformat() if gig.get("updated_at") else None,
        })
    return result

def application_helper(app_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(app_data["_id"]),
        "gig_id": str(app_data.get("gig_id")),
        "player_id": str(app_data.get("player_id")),
        "status": app_data.get("status", "pending"),
        "cover_letter": app_data.get("cover_letter"),
        "cashed_out": app_data.get("cashed_out", False),
        "cashout_date": app_data.get("cashout_date").isoformat() if app_data.get("cashout_date") else None,
        "created_at": app_data.get("created_at").isoformat() if app_data.get("created_at") else None,
        "updated_at": app_data.get("updated_at").isoformat() if app_data.get("updated_at") else None,
    }

def endorsement_helper(endorsement_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(endorsement_data["_id"]),
        "endorsed_id": str(endorsement_data.get("endorsed_id")),
        "endorsed_by": str(endorsement_data.get("endorsed_by")),
        "rating": endorsement_data.get("rating"),
        "comment": endorsement_data.get("comment"),
        "created_at": endorsement_data.get("created_at").isoformat() if endorsement_data.get("created_at") else None,
    }

def soulbound_nft_helper(nft_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(nft_data["_id"]),
        "user_id": str(nft_data.get("user_id")),
        "name": nft_data.get("name"),
        "reputation": nft_data.get("reputation"),
        "minted_at": nft_data.get("minted_at").isoformat() if nft_data.get("minted_at") else None,
    }

def team_helper(team_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(team_data["_id"]),
        "name": team_data.get("name"),
        "description": team_data.get("description"),
        "captain_id": str(team_data.get("captain_id")),
        "members": [str(m) for m in team_data.get("members", [])],
        "created_at": team_data.get("created_at").isoformat() if team_data.get("created_at") else None,
    }

def wallet_helper(wallet_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(wallet_data["_id"]),
        "user_id": str(wallet_data.get("user_id")),
        "balance": wallet_data.get("balance", 0.0),
        "locked_balance": wallet_data.get("locked_balance", 0.0),
        "total_earned": wallet_data.get("total_earned", 0.0),
        "total_spent": wallet_data.get("total_spent", 0.0),
        "created_at": wallet_data.get("created_at").isoformat() if wallet_data.get("created_at") else None,
        "updated_at": wallet_data.get("updated_at").isoformat() if wallet_data.get("updated_at") else None,
    }

def wallet_transaction_helper(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(transaction_data["_id"]),
        "wallet_id": str(transaction_data.get("wallet_id")),
        "user_id": str(transaction_data.get("user_id")),
        "transaction_type": transaction_data.get("transaction_type"),
        "amount": transaction_data.get("amount", 0.0),
        "description": transaction_data.get("description"),
        "reference_id": transaction_data.get("reference_id"),
        "status": transaction_data.get("status", "pending"),
        "created_at": transaction_data.get("created_at").isoformat() if transaction_data.get("created_at") else None,
    }

def sponsor_helper(sponsor_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(sponsor_data["_id"]),
        "name": sponsor_data.get("name"),
        "org_id": str(sponsor_data.get("org_id")),
        "verified": sponsor_data.get("verified"),
        "created_at": sponsor_data.get("created_at").isoformat() if sponsor_data.get("created_at") else None,
    }
