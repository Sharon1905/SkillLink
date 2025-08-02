#!/usr/bin/env python3
"""
Check FastAPI data in the versatile_db database
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def check_fastapi_data():
    """Check what data has been stored from FastAPI requests"""
    print("🔍 Checking FastAPI data in versatile_db database...")
    
    try:
        from backend.database import db
        
        # Check users collection
        print("\n👥 Users Collection:")
        users_count = await db["users"].count_documents({})
        print(f"Total users: {users_count}")
        
        # Get all users
        users = []
        async for user in db["users"].find({}):
            users.append(user)
        
        print(f"\n📋 User Details:")
        for i, user in enumerate(users, 1):
            print(f"\n{i}. User ID: {user.get('_id')}")
            print(f"   Username: {user.get('username', 'N/A')}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   User Type: {user.get('user_type', 'N/A')}")
            print(f"   Created At: {user.get('created_at', 'N/A')}")
            
            # Check if this looks like a FastAPI user (has password field)
            if 'password' in user:
                print(f"   🔐 Has Password: Yes (FastAPI user)")
            else:
                print(f"   🔐 Has Password: No (VERSATILE-DB user)")
        
        # Check other collections that FastAPI might use
        print(f"\n📊 Other Collections:")
        collections = ['gigs', 'applications', 'endorsements', 'soulbound_nfts']
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
            
            if count > 0:
                # Show sample data
                sample = await db[collection].find_one({})
                print(f"     Sample: {sample}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 FastAPI Data Check")
    print("=" * 40)
    
    success = await check_fastapi_data()
    
    if success:
        print("\n✅ Data check completed!")
    else:
        print("\n❌ Data check failed!")

if __name__ == "__main__":
    asyncio.run(main()) 