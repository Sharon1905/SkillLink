#!/usr/bin/env python3
"""
Direct database storage test - tests data storage without FastAPI server
"""

import asyncio
from datetime import datetime
from database import db
from auth import hash_password

async def test_direct_database_storage():
    """Test direct database storage"""
    print("🧪 Testing direct database storage in versatile_db...")
    
    try:
        # Test 1: Create a new user directly in database
        print("\n1️⃣ Creating a NEW user directly in database...")
        new_user_data = {
            "username": f"direct_test_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"directtest{datetime.now().strftime('%H%M%S')}@example.com",
            "hashed_password": hash_password("testpass123"),
            "user_type": "player",
            "bio": "Direct database test user",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db["users"].insert_one(new_user_data)
        print(f"   ✅ NEW user created with ID: {result.inserted_id}")
        
        # Test 2: Create a new gig directly in database
        print("\n2️⃣ Creating a NEW gig directly in database...")
        new_gig_data = {
            "title": f"Direct Test Gig - {datetime.now().strftime('%H:%M:%S')}",
            "description": "This is a direct database test gig",
            "location": "Test Location",
            "game": "Test Game",
            "budget": "₹5,000",
            "skills_required": ["Testing", "Database"],
            "tags": ["test", "direct", "database"],
            "organization_id": "test_org_id",
            "status": "open",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db["gigs"].insert_one(new_gig_data)
        print(f"   ✅ NEW gig created with ID: {result.inserted_id}")
        
        # Test 3: Verify data is stored
        print("\n3️⃣ Verifying data storage...")
        
        # Count total users
        total_users = await db["users"].count_documents({})
        print(f"   Total users in versatile_db: {total_users}")
        
        # Count total gigs
        total_gigs = await db["gigs"].count_documents({})
        print(f"   Total gigs in versatile_db: {total_gigs}")
        
        # Find our test data
        test_users = await db["users"].find({"username": {"$regex": "direct_test_user"}}).to_list(length=10)
        test_gigs = await db["gigs"].find({"title": {"$regex": "Direct Test Gig"}}).to_list(length=10)
        
        print(f"   Direct test users found: {len(test_users)}")
        print(f"   Direct test gigs found: {len(test_gigs)}")
        
        print(f"\n✅ Database: versatile_db")
        print(f"✅ Direct database storage is working!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in direct database test: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 Direct Database Storage Test")
    print("=" * 40)
    
    success = await test_direct_database_storage()
    
    if success:
        print("\n🎉 Direct database test completed!")
        print("💡 Database storage is working correctly!")
    else:
        print("\n❌ Direct database test failed!")

if __name__ == "__main__":
    asyncio.run(main()) 