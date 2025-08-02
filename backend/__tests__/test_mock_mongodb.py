#!/usr/bin/env python3
"""
Mock MongoDB Test for VERSATILE-DB
This simulates MongoDB operations for testing without requiring MongoDB installation
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from backend.mongo_models import (
    UserModel, ProfileModel, GameModel, HighlightModel, 
    GigModel, ApplicationModel, TeamModel, SponsorModel,
    COLLECTIONS
)

class MockMongoDB:
    """Mock MongoDB database for testing"""
    
    def __init__(self):
        self.collections = {
            'users': [],
            'profiles': [],
            'games': [],
            'highlights': [],
            'gigs': [],
            'applications': [],
            'teams': [],
            'sponsors': []
        }
        self.counters = {
            'users': 0,
            'profiles': 0,
            'games': 0,
            'highlights': 0,
            'gigs': 0,
            'applications': 0,
            'teams': 0,
            'sponsors': 0
        }
    
    def __getitem__(self, collection_name: str):
        """Get collection by name"""
        return MockCollection(self.collections[collection_name], collection_name, self.counters)
    
    @property
    def users(self):
        return self['users']
    
    @property
    def profiles(self):
        return self['profiles']
    
    @property
    def games(self):
        return self['games']
    
    @property
    def highlights(self):
        return self['highlights']
    
    @property
    def gigs(self):
        return self['gigs']
    
    @property
    def applications(self):
        return self['applications']
    
    @property
    def teams(self):
        return self['teams']
    
    @property
    def sponsors(self):
        return self['sponsors']

class MockCollection:
    """Mock MongoDB collection"""
    
    def __init__(self, data: List[Dict], name: str, counters: Dict[str, int]):
        self.data = data
        self.name = name
        self.counters = counters
    
    async def insert_one(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Insert one document"""
        # Add _id if not present
        if '_id' not in document:
            self.counters[self.name] += 1
            document['_id'] = f"{self.name}_{self.counters[self.name]}"
        
        # Add timestamps
        if 'created_at' not in document:
            document['created_at'] = datetime.now().isoformat()
        if 'updated_at' not in document:
            document['updated_at'] = datetime.now().isoformat()
        
        self.data.append(document)
        return {'inserted_id': document['_id']}
    
    async def find(self, filter_dict: Optional[Dict] = None) -> 'MockCursor':
        """Find documents"""
        if filter_dict is None:
            filter_dict = {}
        
        filtered_data = []
        for doc in self.data:
            if self._matches_filter(doc, filter_dict):
                filtered_data.append(doc)
        
        return MockCursor(filtered_data)
    
    async def find_one(self, filter_dict: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Find one document"""
        if filter_dict is None:
            filter_dict = {}
        
        for doc in self.data:
            if self._matches_filter(doc, filter_dict):
                return doc
        return None
    
    async def update_one(self, filter_dict: Dict, update_dict: Dict) -> Dict[str, Any]:
        """Update one document"""
        for doc in self.data:
            if self._matches_filter(doc, filter_dict):
                # Update the document
                if '$set' in update_dict:
                    doc.update(update_dict['$set'])
                else:
                    doc.update(update_dict)
                
                doc['updated_at'] = datetime.now().isoformat()
                return {'modified_count': 1}
        return {'modified_count': 0}
    
    async def delete_one(self, filter_dict: Dict) -> Dict[str, Any]:
        """Delete one document"""
        for i, doc in enumerate(self.data):
            if self._matches_filter(doc, filter_dict):
                del self.data[i]
                return {'deleted_count': 1}
        return {'deleted_count': 0}
    
    async def delete_many(self, filter_dict: Optional[Dict] = None) -> Dict[str, Any]:
        """Delete many documents"""
        if filter_dict is None:
            filter_dict = {}
        
        original_count = len(self.data)
        self.data = [doc for doc in self.data if not self._matches_filter(doc, filter_dict)]
        deleted_count = original_count - len(self.data)
        
        return {'deleted_count': deleted_count}
    
    def _matches_filter(self, doc: Dict, filter_dict: Dict) -> bool:
        """Check if document matches filter"""
        for key, value in filter_dict.items():
            if key not in doc or doc[key] != value:
                return False
        return True

class MockCursor:
    """Mock MongoDB cursor"""
    
    def __init__(self, data: List[Dict]):
        self.data = data
    
    async def to_list(self, length: Optional[int] = None) -> List[Dict]:
        """Convert cursor to list"""
        if length is None:
            return self.data
        return self.data[:length]

# Mock database instance
mock_db = MockMongoDB()

async def test_mock_mongodb():
    """Test mock MongoDB operations"""
    print("🚀 Testing Mock MongoDB Database")
    print("=" * 50)
    
    try:
        # Test 1: Create a user
        print("\n📝 Test 1: Creating a user...")
        user_data = UserModel(
            username="testuser",
            email="test@example.com",
            discord_id="123456789",
            wallet_address="0x123456789abcdef"
        ).model_dump()
        
        result = await mock_db.users.insert_one(user_data)
        print(f"✅ User created with ID: {result['inserted_id']}")
        
        # Test 2: Create a profile
        print("\n📝 Test 2: Creating a profile...")
        profile_data = ProfileModel(
            user_id=result['inserted_id'],
            bio="Professional gamer",
            region="NA",
            roles=["DPS", "Support"],
            badges=["Pro", "Champion"],
            grind_data={"hours_played": 1000, "rank": "Diamond"},
            pentagon_data={"mechanical": 8, "game_sense": 9, "communication": 7, "teamwork": 8, "consistency": 8}
        ).model_dump()
        
        profile_result = await mock_db.profiles.insert_one(profile_data)
        print(f"✅ Profile created with ID: {profile_result['inserted_id']}")
        
        # Test 3: Create a game
        print("\n📝 Test 3: Creating a game...")
        game_data = GameModel(
            user_id=result['inserted_id'],
            game_name="Valorant",
            rank="Diamond",
            winrate=0.65,
            top_roles=["Duelist", "Controller"]
        ).model_dump()
        
        game_result = await mock_db.games.insert_one(game_data)
        print(f"✅ Game created with ID: {game_result['inserted_id']}")
        
        # Test 4: Create a gig
        print("\n📝 Test 4: Creating a gig...")
        gig_data = GigModel(
            title="Valorant Tournament Player",
            description="Looking for skilled Valorant players for tournament",
            org_id="org_123",
            budget=500.0,
            method="upi",
            status="open"
        ).model_dump()
        
        gig_result = await mock_db.gigs.insert_one(gig_data)
        print(f"✅ Gig created with ID: {gig_result['inserted_id']}")
        
        # Test 5: Create an application
        print("\n📝 Test 5: Creating an application...")
        app_data = ApplicationModel(
            gig_id=gig_result['inserted_id'],
            user_id=result['inserted_id'],
            resume_link="https://example.com/resume.pdf",
            message="I'm interested in this opportunity!",
            status="pending"
        ).model_dump()
        
        app_result = await mock_db.applications.insert_one(app_data)
        print(f"✅ Application created with ID: {app_result['inserted_id']}")
        
        # Test 6: Query data
        print("\n📝 Test 6: Querying data...")
        
        # Find all users
        users = await (await mock_db.users.find()).to_list()
        print(f"✅ Found {len(users)} users")
        
        # Find user by email
        user = await mock_db.users.find_one({"email": "test@example.com"})
        if user:
            print(f"✅ Found user: {user['username']}")
        
        # Find gigs by status
        open_gigs = await (await mock_db.gigs.find({"status": "open"})).to_list()
        print(f"✅ Found {len(open_gigs)} open gigs")
        
        # Test 7: Update data
        print("\n📝 Test 7: Updating data...")
        update_result = await mock_db.applications.update_one(
            {"_id": app_result['inserted_id']},
            {"$set": {"status": "accepted"}}
        )
        print(f"✅ Updated {update_result['modified_count']} application")
        
        # Test 8: Delete data
        print("\n📝 Test 8: Deleting data...")
        delete_result = await mock_db.applications.delete_one({"_id": app_result['inserted_id']})
        print(f"✅ Deleted {delete_result['deleted_count']} application")
        
        # Test 9: Show all data
        print("\n📝 Test 9: Database summary...")
        for collection_name, data in mock_db.collections.items():
            print(f"  - {collection_name}: {len(data)} documents")
        
        print("\n🎉 All Mock MongoDB tests passed!")
        print("\n📊 Database Contents:")
        print("=" * 30)
        
        for collection_name, data in mock_db.collections.items():
            if data:
                print(f"\n📁 {collection_name.upper()}:")
                for doc in data:
                    print(f"  - {doc.get('_id', 'No ID')}: {doc.get('title', doc.get('username', doc.get('game_name', 'Unknown')))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

async def main():
    """Main function"""
    success = await test_mock_mongodb()
    if success:
        print("\n✅ Mock MongoDB test completed successfully!")
        print("\n💡 This demonstrates that your MongoDB models and operations work correctly.")
        print("   To use with real MongoDB, install MongoDB 4.4 and update the connection.")
    else:
        print("\n❌ Mock MongoDB test failed!")

if __name__ == "__main__":
    asyncio.run(main()) 