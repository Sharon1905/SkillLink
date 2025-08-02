# check_db_gigs.py (or check_db_users.py if you renamed it)
import asyncio
import sys
from pathlib import Path
import os
from dotenv import load_dotenv

# Add the backend directory to the sys.path for imports to work
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))
sys.path.append(str(backend_dir / "app"))

load_dotenv(backend_dir / "app" / ".env")

from db.database import db, test_mongo_connection
import models # Keep models import, but we'll print raw data

async def check_users_in_db():
    print("Connecting to MongoDB to check users...")
    try:
        if not await test_mongo_connection():
            print("❌ MongoDB connection failed. Cannot check users.")
            return

        users_cursor = db["users"].find({})
        users = await users_cursor.to_list(length=100)

        if users:
            print(f"Found {len(users)} users in the database (RAW DATA):")
            for user_doc in users:
                print(user_doc) # <--- CRITICAL CHANGE: Print raw user_doc
                # You can also selectively print:
                # print(f"  - ID: {user_doc.get('_id')}, Email: {user_doc.get('email')}, Hashed Password: {user_doc.get('hashed_password')}")
        else:
            print("No users found in the database.")

    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_users_in_db())