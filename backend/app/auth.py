from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter # Import APIRouter
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
import os
from datetime import datetime, timezone, timedelta
import models # Import models to access User model
from bson import ObjectId
from database import db

router = APIRouter(prefix="/auth", tags=["auth"])  # Create router with /auth prefix

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# It's recommended to load SECRET_KEY from environment variables for security
SECRET_KEY = os.getenv("SECRET_KEY", "SkillLink-super-secret-key-replace-me") # Use os.getenv
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> models.User: # Type hint return as models.User
    try:
        print("Received token: ", token)
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("id")
        user_email: str = payload.get("email")
        user_type: str = payload.get("user_type")

        if user_id is None or user_email is None or user_type is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        
        # Return a dictionary that matches the structure User model expects (or directly create User model instance)
        # We'll ensure it has '_id' for database queries, and 'id' as string for consistency.
        return {
            "_id": ObjectId(user_id), # Store as ObjectId for DB queries
            "id": user_id,           # Store as string for direct access if needed
            "email": user_email,
            "user_type": user_type,
            "username": payload.get("username", "Unknown") # Get username from payload if available
        }

    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except JWTError as e:
        print("Token decode error: ", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=1)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

# Verify org/player functions already use get_current_user
def verify_org(current_user: models.User = Depends(get_current_user)): # Use models.User
    if current_user.user_type != "org": # Access via .user_type if it's a Pydantic model
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can access this route.")
    return current_user

def verify_player(current_user: models.User = Depends(get_current_user)): # Use models.User
    if current_user.user_type != "player": # Access via .user_type if it's a Pydantic model
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only players can access this route.")
    return current_user

from fastapi import Form

@router.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    user = await db.users.find_one({"email": email.lower()})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={
            "id": str(user["_id"]),
            "email": user["email"],
            "user_type": user["user_type"],
            "username": user.get("username", "Unknown")
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}
