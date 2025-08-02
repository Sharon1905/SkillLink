#!/usr/bin/env python3
"""
Check all databases in MongoDB to find where FastAPI data is stored
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def check_all_databases():
    """Check all databases in MongoDB"""
    print("🔍 Checking all databases in MongoDB...")
    
    try:
        from backend.database import client
        
        # List all databases
        databases = await client.list_database_names()
        print(f"\n📊 Available databases: {databases}")
        
        for db_name in databases:
            print(f"\n🔍 Checking database: {db_name}")
            db = client[db_name]
            
            # List collections in this database
            collections = await db.list_collection_names()
            print(f"   Collections: {collections}")
            
            # Check users collection if it exists
            if 'users' in collections:
                users_count = await db["users"].count_documents({})
                print(f"   Users count: {users_count}")
                
                if users_count > 0:
                    # Check for FastAPI users (with password field)
                    fastapi_users = []
                    async for user in db["users"].find({"password": {"$exists": True}}):
                        fastapi_users.append(user)
                    
                    print(f"   FastAPI users: {len(fastapi_users)}")
                    for user in fastapi_users:
                        print(f"      - {user.get('username')} ({user.get('email')}) - {user.get('user_type')}")
            
            # Check other collections
            for collection in ['gigs', 'applications', 'endorsements']:
                if collection in collections:
                    count = await db[collection].count_documents({})
                    if count > 0:
                        print(f"   {collection}: {count} documents")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 All Databases Check")
    print("=" * 40)
    
    success = await check_all_databases()
    
    if success:
        print("\n🎉 Database check completed!")
    else:
        print("\n❌ Database check failed!")

if __name__ == "__main__":
    asyncio.run(main()) 