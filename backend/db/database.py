from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB 4 Configuration for local development
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "versatile_db")

# MongoDB 4 compatible client configuration
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,  # 5 second timeout
    connectTimeoutMS=10000,         # 10 second connection timeout
    socketTimeoutMS=20000,          # 20 second socket timeout
    maxPoolSize=10,                 # Connection pool size
    minPoolSize=1,                  # Minimum connections
    maxIdleTimeMS=30000,            # Max idle time for connections
    retryWrites=True,               # Enable retry writes for MongoDB 4
    retryReads=True                 # Enable retry reads for MongoDB 4
)

db = client[MONGO_DB_NAME]

# Test connection function
async def test_mongo_connection():
    """Test MongoDB connection"""
    try:
        # Ping the database
        await client.admin.command('ping')
        print("✅ MongoDB 4 connection successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

# Get database instance
def get_database():
    """Get MongoDB database instance"""
    return db
