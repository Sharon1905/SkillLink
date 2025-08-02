"""
Seed data script for MongoDB VERSATILE-DB
Converted from SQLAlchemy to MongoDB
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from bson import ObjectId

# --- CORRECTED sys.path.append logic ---
# Get the path to the 'backend' directory
backend_dir = Path(__file__).parent.parent
# Add 'backend' to sys.path so 'db.database' and 'app.models' can be found
sys.path.append(str(backend_dir))
# Add 'backend/app' to sys.path specifically for imports like 'from users import hash_password'
sys.path.append(str(backend_dir / "app"))
# --- END CORRECTED sys.path.append logic ---

# Load .env from the 'app' directory (relative to backend_dir)
load_dotenv(backend_dir / "app" / ".env")

# Now imports should work correctly
from db.database import db, test_mongo_connection
import models # Import your unified models from app.models
from users import hash_password # Import hash_password from users.py

# Access collection names (defined here for seed_data's clarity)
COLLECTIONS = {
    "users": "users",
    "profiles": "profiles",
    "games": "games",
    "highlights": "highlights",
    "gigs": "gigs",
    "applications": "applications",
    "endorsements": "endorsements",
    "soulbound_nfts": "soulbound_nfts",
    "teams": "teams",
    "sponsors": "sponsors",
    "conversations": "conversations",
    "messages": "messages"
} 

async def seed_data():
    """Seed MongoDB with sample data"""
    
    # Test connection first
    if not await test_mongo_connection():
        print("❌ Cannot connect to MongoDB. Please ensure MongoDB is running.")
        return
    
    try:
        print("🔄 Seeding MongoDB with sample data...")
        
        # Clear existing data
        for collection_name in COLLECTIONS.values():
            await db[collection_name].delete_many({})
        print("✅ Cleared existing data")
        
        # Create users (using models.User) - ONLY these two users will be created
        users_data = [
            {"email": "hello@example.com", "username": "player_user", "user_type": "player"},
            {"email": "hello1@org.com", "username": "org_user", "user_type": "org"},
        ]
        
        # Insert users
        users = []
        org_users = []
        player_users = []
        for user_data in users_data:
            hashed_pw = hash_password("12345678") # Both users get this password
            user_doc = {**user_data, "hashed_password": hashed_pw, "created_at": datetime.now(timezone.utc)}
            
            result = await db[COLLECTIONS["users"]].insert_one(user_doc)
            
            user_model = models.User(
                **user_doc,
                id=result.inserted_id
            )
            users.append(user_model)
            if user_model.user_type == "org":
                org_users.append(user_model)
            else:
                player_users.append(user_model) # Now populating player_users with hello@example.com
        
        print(f"✅ Created {len(users)} users")

        print("\n🎉 MongoDB seeding completed successfully!")
        print("\n📊 Data Summary:")
        for collection_name in COLLECTIONS.values():
            count = await db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        import traceback
        traceback.print_exc()
        raise # Re-raise to show in terminal

if __name__ == "__main__":
    asyncio.run(seed_data())