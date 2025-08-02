#!/usr/bin/env python3
"""
Test FastAPI endpoints and verify data storage
"""

import asyncio
import httpx
import json
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_fastapi_endpoints():
    """Test FastAPI endpoints and check data storage"""
    print("🧪 Testing FastAPI endpoints...")
    
    async with httpx.AsyncClient() as client:
        base_url = "http://127.0.0.1:8000"
        
        # Test 1: Root endpoint
        print("\n1️⃣ Testing root endpoint...")
        try:
            response = await client.get(f"{base_url}/")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 2: Register a new user
        print("\n2️⃣ Testing user registration...")
        register_data = {
            "username": "test_player",
            "email": "testplayer@example.com",
            "password": "testpass123",
            "user_type": "player"
        }
        
        try:
            response = await client.post(
                f"{base_url}/register",
                json=register_data
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
        
        # Test 3: Login
        print("\n3️⃣ Testing user login...")
        login_data = {
            "email": "testplayer@example.com",
            "password": "testpass123"
        }
        
        try:
            response = await client.post(
                f"{base_url}/login",
                json=login_data
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                login_response = response.json()
                print(f"   Response: {login_response}")
                token = login_response.get("access_token")
            else:
                print(f"   Error: {response.text}")
                token = None
        except Exception as e:
            print(f"   ❌ Error: {e}")
            token = None
        
        # Test 4: Get user profile (with token)
        if token:
            print("\n4️⃣ Testing get profile with token...")
            headers = {"Authorization": f"Bearer {token}"}
            
            try:
                response = await client.get(
                    f"{base_url}/me",
                    headers=headers
                )
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"   Response: {response.json()}")
                else:
                    print(f"   Error: {response.text}")
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        return True

async def check_database_after_test():
    """Check if the test data was stored in the database"""
    print("\n🔍 Checking database after tests...")
    
    try:
        from backend.database import db
        
        # Check for the test user
        test_user = await db["users"].find_one({"email": "testplayer@example.com"})
        
        if test_user:
            print("✅ Test user found in database!")
            print(f"   User ID: {test_user.get('_id')}")
            print(f"   Username: {test_user.get('username')}")
            print(f"   Email: {test_user.get('email')}")
            print(f"   User Type: {test_user.get('user_type')}")
            print(f"   Has Password: {'Yes' if 'password' in test_user else 'No'}")
            
            # Count total users
            total_users = await db["users"].count_documents({})
            print(f"\n📊 Total users in database: {total_users}")
            
            return True
        else:
            print("❌ Test user not found in database!")
            return False
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 FastAPI Endpoint Test")
    print("=" * 40)
    
    # Test endpoints
    success = await test_fastapi_endpoints()
    
    if success:
        print("\n✅ Endpoint tests completed!")
        
        # Check database
        db_success = await check_database_after_test()
        
        if db_success:
            print("\n🎉 All tests passed! FastAPI is storing data in versatile_db.")
        else:
            print("\n⚠️ Endpoints worked but data storage needs investigation.")
    else:
        print("\n❌ Endpoint tests failed!")

if __name__ == "__main__":
    asyncio.run(main()) 