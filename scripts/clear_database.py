#!/usr/bin/env python3
"""
Clear database script for VERSATILE-DB MongoDB
Converted from SQLAlchemy to MongoDB
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def clear_database():
    """Clear all data from MongoDB database"""
    try:
        from backend.database import db, test_mongo_connection
        from backend.mongo_models import COLLECTIONS
        
        # Test connection first
        if not await test_mongo_connection():
            print("❌ Cannot connect to MongoDB. Please ensure MongoDB is running.")
            return
        
        print("🗑️ Clearing all data from MongoDB database...")
        
        # Clear all collections
        for collection_name in COLLECTIONS.values():
            result = await db[collection_name].delete_many({})
            print(f"  - {collection_name}: {result.deleted_count} documents deleted")
        
        print("✅ MongoDB database cleared successfully!")
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")

async def main():
    """Main function"""
    print("🚀 Clearing VERSATILE-DB MongoDB...")
    await clear_database()

if __name__ == '__main__':
    asyncio.run(main()) 