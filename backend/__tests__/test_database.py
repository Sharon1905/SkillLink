#!/usr/bin/env python3
"""
Test script for VERSATILE-DB MongoDB
Converted from PostgreSQL to MongoDB
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_mongodb_connection():
    """Test MongoDB connection"""
    print("🔍 Testing MongoDB connection...")
    
    try:
        from backend.database import test_mongo_connection
        success = await test_mongo_connection()
        if success:
            print("✅ MongoDB connection successful!")
            return True
        else:
            print("❌ MongoDB connection failed!")
            return False
    except Exception as e:
        print(f"❌ Error testing MongoDB connection: {e}")
        return False

async def test_collections():
    """Test MongoDB collections"""
    print("🔍 Testing MongoDB collections...")
    
    try:
        from backend.database import db
        from backend.mongo_models import COLLECTIONS
        
        results = {}
        for collection_name in COLLECTIONS.values():
            count = await db[collection_name].count_documents({})
            results[collection_name] = count
            print(f"  - {collection_name}: {count} documents")
        
        return results
    except Exception as e:
        print(f"❌ Error testing collections: {e}")
        return None

async def test_sample_queries():
    """Test sample MongoDB queries"""
    print("🔍 Testing sample queries...")
    
    try:
        from backend.database import db
        from backend.mongo_models import COLLECTIONS
        
        # Test 1: Find a user
        user = await db[COLLECTIONS["users"]].find_one({})
        if user:
            print(f"✅ Found user: {user.get('username', 'Unknown')}")
        else:
            print("❌ No users found")
        
        # Test 2: Find a gig
        gig = await db[COLLECTIONS["gigs"]].find_one({})
        if gig:
            print(f"✅ Found gig: {gig.get('title', 'Unknown')}")
        else:
            print("❌ No gigs found")
        
        # Test 3: Count profiles
        profile_count = await db[COLLECTIONS["profiles"]].count_documents({})
        print(f"✅ Found {profile_count} profiles")
        
        # Test 4: Find games
        games = await db[COLLECTIONS["games"]].find().limit(3).to_list(length=3)
        print(f"✅ Found {len(games)} sample games")
        
        # Test 5: Find highlights
        highlights = await db[COLLECTIONS["highlights"]].find().limit(3).to_list(length=3)
        print(f"✅ Found {len(highlights)} sample highlights")
        
        return True
    except Exception as e:
        print(f"❌ Error testing queries: {e}")
        return False

async def test_data_integrity():
    """Test data integrity"""
    print("🔍 Testing data integrity...")
    
    try:
        from backend.database import db
        from backend.mongo_models import COLLECTIONS
        
        # Test 1: Check if users have required fields
        users = await db[COLLECTIONS["users"]].find({}, {"email": 1, "username": 1}).to_list(length=5)
        for user in users:
            if not user.get("email") or not user.get("username"):
                print(f"❌ User missing required fields: {user}")
                return False
        
        print("✅ User data integrity check passed")
        
        # Test 2: Check if gigs have required fields
        gigs = await db[COLLECTIONS["gigs"]].find({}, {"title": 1, "description": 1}).to_list(length=5)
        for gig in gigs:
            if not gig.get("title") or not gig.get("description"):
                print(f"❌ Gig missing required fields: {gig}")
                return False
        
        print("✅ Gig data integrity check passed")
        
        # Test 3: Check if profiles have user_id
        profiles = await db[COLLECTIONS["profiles"]].find({}, {"user_id": 1}).to_list(length=5)
        for profile in profiles:
            if not profile.get("user_id"):
                print(f"❌ Profile missing user_id: {profile}")
                return False
        
        print("✅ Profile data integrity check passed")
        
        return True
    except Exception as e:
        print(f"❌ Error testing data integrity: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 Testing VERSATILE-DB MongoDB...")
    print("=" * 50)
    
    # Test 1: Connection
    if not await test_mongodb_connection():
        print("❌ Connection test failed")
        return
    
    # Test 2: Collections
    collections = await test_collections()
    if collections is None:
        print("❌ Collections test failed")
        return
    
    # Test 3: Sample queries
    if not await test_sample_queries():
        print("❌ Sample queries test failed")
        return
    
    # Test 4: Data integrity
    if not await test_data_integrity():
        print("❌ Data integrity test failed")
        return
    
    print("\n🎉 All tests passed successfully!")
    print("\n📊 Test Summary:")
    print("  ✅ MongoDB connection")
    print("  ✅ Collections access")
    print("  ✅ Sample queries")
    print("  ✅ Data integrity")
    
    print("\n📋 Collection Summary:")
    for collection_name, count in collections.items():
        print(f"  - {collection_name}: {count} documents")

if __name__ == "__main__":
    asyncio.run(main()) 