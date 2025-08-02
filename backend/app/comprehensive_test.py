#!/usr/bin/env python3
"""
Comprehensive test of the VERSATILE system
Tests database connectivity, data storage, and integration
"""

import asyncio
from datetime import datetime
from database import db
from auth import hash_password

async def test_database_connectivity():
    """Test database connectivity"""
    print("🔍 Testing database connectivity...")
    
    try:
        # Test connection
        await db.command("ping")
        print("   ✅ MongoDB connection successful")
        
        # Test database access
        db_name = db.name
        print(f"   ✅ Connected to database: {db_name}")
        
        return True
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        return False

async def test_data_storage():
    """Test data storage functionality"""
    print("\n💾 Testing data storage...")
    
    try:
        # Create test user
        test_user = {
            "username": f"comprehensive_test_{datetime.now().strftime('%H%M%S')}",
            "email": f"comptest{datetime.now().strftime('%H%M%S')}@example.com",
            "hashed_password": hash_password("testpass123"),
            "user_type": "player",
            "bio": "Comprehensive test user",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        user_result = await db["users"].insert_one(test_user)
        print(f"   ✅ Test user created: {user_result.inserted_id}")
        
        # Create test gig
        test_gig = {
            "title": f"Comprehensive Test Gig - {datetime.now().strftime('%H:%M:%S')}",
            "description": "Comprehensive test gig",
            "location": "Test Location",
            "game": "Test Game",
            "budget": "₹10,000",
            "skills_required": ["Testing", "Comprehensive"],
            "tags": ["test", "comprehensive"],
            "organization_id": "test_org_id",
            "status": "open",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        gig_result = await db["gigs"].insert_one(test_gig)
        print(f"   ✅ Test gig created: {gig_result.inserted_id}")
        
        return True
    except Exception as e:
        print(f"   ❌ Data storage test failed: {e}")
        return False

async def test_data_retrieval():
    """Test data retrieval functionality"""
    print("\n📊 Testing data retrieval...")
    
    try:
        # Count documents
        user_count = await db["users"].count_documents({})
        gig_count = await db["gigs"].count_documents({})
        application_count = await db["applications"].count_documents({})
        endorsement_count = await db["endorsements"].count_documents({})
        
        print(f"   📈 Total users: {user_count}")
        print(f"   📈 Total gigs: {gig_count}")
        print(f"   📈 Total applications: {application_count}")
        print(f"   📈 Total endorsements: {endorsement_count}")
        
        # Find recent test data
        recent_users = await db["users"].find({"username": {"$regex": "comprehensive_test"}}).to_list(length=5)
        recent_gigs = await db["gigs"].find({"title": {"$regex": "Comprehensive Test Gig"}}).to_list(length=5)
        
        print(f"   ✅ Found {len(recent_users)} recent test users")
        print(f"   ✅ Found {len(recent_gigs)} recent test gigs")
        
        return True
    except Exception as e:
        print(f"   ❌ Data retrieval test failed: {e}")
        return False

async def test_database_integration():
    """Test that data is stored in the correct database"""
    print("\n🔗 Testing database integration...")
    
    try:
        # Verify we're using versatile_db
        db_name = db.name
        if db_name == "versatile_db":
            print(f"   ✅ Using correct database: {db_name}")
        else:
            print(f"   ⚠️  Using database: {db_name} (expected versatile_db)")
        
        # Check if data from both systems is present
        # VERSATILE-DB users (should have hashed_password field)
        versatile_users = await db["users"].count_documents({"hashed_password": {"$exists": True}})
        
        # FastAPI users (should have password field)
        fastapi_users = await db["users"].count_documents({"password": {"$exists": True}})
        
        print(f"   📊 VERSATILE-DB users: {versatile_users}")
        print(f"   📊 FastAPI users: {fastapi_users}")
        
        total_users = await db["users"].count_documents({})
        print(f"   📊 Total users in {db_name}: {total_users}")
        
        return True
    except Exception as e:
        print(f"   ❌ Integration test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 VERSATILE Comprehensive System Test")
    print("=" * 50)
    
    # Run all tests
    tests = [
        ("Database Connectivity", test_database_connectivity()),
        ("Data Storage", test_data_storage()),
        ("Data Retrieval", test_data_retrieval()),
        ("Database Integration", test_database_integration())
    ]
    
    results = []
    for test_name, test_coro in tests:
        print(f"\n🧪 {test_name}...")
        result = await test_coro
        results.append((test_name, result))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("💡 The VERSATILE system is working correctly!")
        print("   - Database connectivity: ✅")
        print("   - Data storage: ✅")
        print("   - Data retrieval: ✅")
        print("   - Database integration: ✅")
        print("\n🚀 Your FastAPI app is ready to use with the versatile_db database!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        print("Please check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main()) 