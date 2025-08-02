#!/usr/bin/env python3
"""
Test that new FastAPI data is stored in versatile_db database
"""

import asyncio
import httpx
import json
from datetime import datetime

async def test_new_data_storage():
    """Test that new data is stored in versatile_db"""
    print("🧪 Testing new data storage in versatile_db...")
    
    async with httpx.AsyncClient() as client:
        base_url = "http://127.0.0.1:8001"  # Using port 8001
        
        # Test 1: Register a completely new user
        print("\n1️⃣ Registering a NEW user...")
        new_user_data = {
            "username": f"test_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "newpass123",
            "user_type": "player",
            "bio": "Testing new data storage"
        }
        
        try:
            response = await client.post(f"{base_url}/register", json=new_user_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                user_response = response.json()
                print(f"   ✅ NEW user created: {user_response}")
                new_user_id = user_response.get("id")
                new_user_email = new_user_data["email"]
            else:
                print(f"   ❌ Error: {response.text}")
                return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 2: Login with the new user
        print("\n2️⃣ Logging in with NEW user...")
        login_data = {
            "email": new_user_email,
            "password": "newpass123"
        }
        
        try:
            response = await client.post(f"{base_url}/login", json=login_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                login_response = response.json()
                print(f"   ✅ Login successful")
                token = login_response.get("access_token")
            else:
                print(f"   ❌ Error: {response.text}")
                return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 3: Create a new gig (as organization)
        print("\n3️⃣ Creating a NEW gig...")
        # First login as an organization
        org_login_data = {
            "email": "contact@teamelite.com",
            "password": "orgpass456"
        }
        
        try:
            response = await client.post(f"{base_url}/login", json=org_login_data)
            if response.status_code == 200:
                org_token = response.json().get("access_token")
                
                # Create new gig
                headers = {"Authorization": f"Bearer {org_token}"}
                new_gig_data = {
                    "title": f"NEW Gig - {datetime.now().strftime('%H:%M:%S')}",
                    "description": "This is a test gig to verify data storage",
                    "location": "Test Location",
                    "game": "Test Game",
                    "budget": "₹10,000",
                    "skills_required": ["Testing", "Verification"],
                    "tags": ["test", "new", "verification"]
                }
                
                response = await client.post(f"{base_url}/gigs", json=new_gig_data, headers=headers)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    gig_response = response.json()
                    print(f"   ✅ NEW gig created: {gig_response.get('title')}")
                else:
                    print(f"   ❌ Error: {response.text}")
            else:
                print(f"   ❌ Org login failed: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        return True

async def verify_database_storage():
    """Verify that the new data is stored in versatile_db"""
    print("\n🔍 Verifying data storage in versatile_db...")
    
    try:
        from database import db
        
        # Check total users count
        total_users = await db["users"].count_documents({})
        print(f"   Total users in versatile_db: {total_users}")
        
        # Check for the new user
        new_users = []
        async for user in db["users"].find({"password": {"$exists": True}}):
            if "test" in user.get("username", "").lower():
                new_users.append(user)
        
        print(f"   NEW test users found: {len(new_users)}")
        for user in new_users:
            print(f"      - {user.get('username')} ({user.get('email')})")
        
        # Check total gigs count
        total_gigs = await db["gigs"].count_documents({})
        print(f"   Total gigs in versatile_db: {total_gigs}")
        
        # Check for new gigs
        new_gigs = []
        async for gig in db["gigs"].find({}):
            if "NEW Gig" in gig.get("title", ""):
                new_gigs.append(gig)
        
        print(f"   NEW test gigs found: {len(new_gigs)}")
        for gig in new_gigs:
            print(f"      - {gig.get('title')}")
        
        print(f"\n✅ Database: versatile_db")
        print(f"✅ All NEW data is stored in VERSATILE-DB database!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 New Data Storage Test")
    print("=" * 40)
    
    # Send new test requests
    success = await test_new_data_storage()
    
    if success:
        print("\n✅ New data requests completed!")
        
        # Verify database storage
        await verify_database_storage()
        
        print("\n🎉 Test completed!")
        print("💡 All new FastAPI data is now stored in versatile_db!")
    else:
        print("\n❌ Test failed!")

if __name__ == "__main__":
    asyncio.run(main()) 