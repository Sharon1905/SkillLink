#!/usr/bin/env python3
"""
Test script to verify FastAPI app database connection and basic operations
"""

import asyncio
import sys
from database import db, test_mongo_connection

async def test_fastapi_database():
    """Test FastAPI app database connection and operations"""
    print("🔍 Testing FastAPI app database connection...")
    
    # Test connection
    if not await test_mongo_connection():
        print("❌ Database connection failed!")
        return False
    
    print("✅ Database connection successful!")
    
    # Test collections
    print("\n📊 Available collections:")
    collections = await db.list_collection_names()
    for collection in collections:
        count = await db[collection].count_documents({})
        print(f"  - {collection}: {count} documents")
    
    # Test user creation (simulate FastAPI app operation)
    print("\n🧪 Testing user creation...")
    test_user = {
        "username": "test_user",
        "email": "test@example.com",
        "password": "hashed_password_here",
        "user_type": "player"
    }
    
    try:
        result = await db["users"].insert_one(test_user)
        print(f"✅ Test user created with ID: {result.inserted_id}")
        
        # Clean up test user
        await db["users"].delete_one({"_id": result.inserted_id})
        print("✅ Test user cleaned up")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return False
    
    return True

async def main():
    """Main function"""
    print("🚀 FastAPI App Database Test")
    print("=" * 40)
    
    success = await test_fastapi_database()
    
    if success:
        print("\n🎉 All tests passed!")
        print("FastAPI app is ready to use with versatile_db database.")
    else:
        print("\n❌ Tests failed!")
        print("Please check the database connection and configuration.")

if __name__ == "__main__":
    asyncio.run(main()) 