#!/usr/bin/env python3
"""
Show all users in the versatile_db database to prove data storage
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def show_all_users():
    """Show all users in the database"""
    print("🔍 Showing ALL users in versatile_db database...")
    
    try:
        from backend.database import db
        
        # Get all users
        all_users = []
        async for user in db["users"].find({}):
            all_users.append(user)
        
        print(f"\n📊 Total users in versatile_db: {len(all_users)}")
        
        # Separate VERSATILE-DB users from FastAPI users
        versatile_users = []
        fastapi_users = []
        
        for user in all_users:
            if 'password' in user:
                fastapi_users.append(user)
            else:
                versatile_users.append(user)
        
        print(f"\n👥 VERSATILE-DB Users ({len(versatile_users)}):")
        for i, user in enumerate(versatile_users, 1):
            print(f"   {i}. {user.get('username')} ({user.get('email')})")
        
        print(f"\n🚀 FastAPI Users ({len(fastapi_users)}):")
        for i, user in enumerate(fastapi_users, 1):
            print(f"   {i}. {user.get('username')} ({user.get('email')}) - {user.get('user_type')}")
            print(f"      ID: {user.get('_id')}")
            print(f"      Has Password: Yes")
        
        # Show other collections
        print(f"\n📋 Other Collections in versatile_db:")
        collections = ['gigs', 'applications', 'endorsements', 'soulbound_nfts']
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
            
            if count > 0:
                # Show sample data
                sample = await db[collection].find_one({})
                if sample:
                    print(f"     Sample: {sample.get('title', sample.get('_id', 'N/A'))}")
        
        print(f"\n✅ Database: versatile_db")
        print(f"✅ Connection: mongodb://localhost:27017")
        print(f"✅ All data is stored in the VERSATILE-DB database!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 Complete Database Check")
    print("=" * 40)
    
    success = await show_all_users()
    
    if success:
        print("\n🎉 Database check completed!")
    else:
        print("\n❌ Database check failed!")

if __name__ == "__main__":
    asyncio.run(main()) 