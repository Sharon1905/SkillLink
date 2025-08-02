#!/usr/bin/env python3
"""
Debug script to understand database connection
"""

import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_database():
    # Load environment variables
    load_dotenv()

    print("🔍 Debugging database connection...")
    print(f"MONGO_URL: {os.getenv('MONGO_URL', 'mongodb://localhost:27017')}")
    print(f"MONGO_DB_NAME: {os.getenv('MONGO_DB_NAME', 'versatile_db')}")

    # Create client
    client = AsyncIOMotorClient(
        os.getenv("MONGO_URL", "mongodb://localhost:27017"),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        socketTimeoutMS=20000,
        maxPoolSize=10,
        minPoolSize=1,
        maxIdleTimeMS=30000,
        retryWrites=True,
        retryReads=True
    )

    # Get database
    db_name = os.getenv("MONGO_DB_NAME", "versatile_db")
    db = client[db_name]

    print(f"Expected database name: {db_name}")
    print(f"Actual database name: {db.name}")

    # List all databases
    print("\n📊 Available databases:")
    db_names = await client.list_database_names()
    for db_info in db_names:
        print(f"   - {db_info}")

    print("\n✅ Debug complete!")

if __name__ == "__main__":
    asyncio.run(debug_database()) 