#!/usr/bin/env python3
"""
Simple MongoDB connection test for VERSATILE-DB
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_mongodb():
    """Test MongoDB connection and basic operations"""
    print("🔍 Testing MongoDB connection...")
    
    try:
        from backend.database import db, test_mongo_connection
        
        # Test connection
        if not await test_mongo_connection():
            print("❌ MongoDB connection failed!")
            return False
        
        print("✅ MongoDB connection successful!")
        
        # Test basic operations
        print("\n🔍 Testing basic operations...")
        
        # Test insert
        test_doc = {"test": "data", "timestamp": "2024-01-01"}
        result = await db.test_collection.insert_one(test_doc)
        print(f"✅ Insert test: {result.inserted_id}")
        
        # Test find
        found_doc = await db.test_collection.find_one({"test": "data"})
        if found_doc:
            print(f"✅ Find test: {found_doc}")
        else:
            print("❌ Find test failed")
        
        # Test delete
        delete_result = await db.test_collection.delete_one({"test": "data"})
        print(f"✅ Delete test: {delete_result.deleted_count} document(s) deleted")
        
        # Test collections
        print("\n📊 Available collections:")
        collections = await db.list_collection_names()
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 MongoDB Connection Test")
    print("=" * 40)
    
    success = await test_mongodb()
    
    if success:
        print("\n🎉 All tests passed!")
        print("MongoDB is working correctly.")
    else:
        print("\n❌ Tests failed!")
        print("Please check your MongoDB installation and connection.")

if __name__ == "__main__":
    asyncio.run(main()) 