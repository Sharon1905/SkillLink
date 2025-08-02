#!/usr/bin/env python3
"""
Send test requests to FastAPI server and store data in versatile_db database
"""

import asyncio
import httpx
import json
from datetime import datetime

async def send_test_requests():
    """Send various test requests to the FastAPI server"""
    print("🚀 Sending test requests to FastAPI server...")
    
    async with httpx.AsyncClient() as client:
        base_url = "http://127.0.0.1:8000"
        
        # Test 1: Register a new player
        print("\n1️⃣ Registering a new player...")
        player_data = {
            "username": "esports_player_1",
            "email": "player1@esports.com",
            "password": "securepass123",
            "user_type": "player",
            "bio": "Professional Valorant player",
            "location": "Mumbai, India",
            "games": ["Valorant", "CS:GO"]
        }
        
        try:
            response = await client.post(f"{base_url}/register", json=player_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                player_response = response.json()
                print(f"   ✅ Player registered: {player_response}")
                player_id = player_response.get("id")
            else:
                print(f"   ❌ Error: {response.text}")
                player_id = None
        except Exception as e:
            print(f"   ❌ Error: {e}")
            player_id = None
        
        # Test 2: Register a new organization
        print("\n2️⃣ Registering a new organization...")
        org_data = {
            "username": "team_elite_org",
            "email": "contact@teamelite.com",
            "password": "orgpass456",
            "user_type": "org",
            "bio": "Professional esports organization",
            "location": "Delhi, India"
        }
        
        try:
            response = await client.post(f"{base_url}/register", json=org_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                org_response = response.json()
                print(f"   ✅ Organization registered: {org_response}")
                org_id = org_response.get("id")
            else:
                print(f"   ❌ Error: {response.text}")
                org_id = None
        except Exception as e:
            print(f"   ❌ Error: {e}")
            org_id = None
        
        # Test 3: Login as organization
        print("\n3️⃣ Logging in as organization...")
        login_data = {
            "email": "contact@teamelite.com",
            "password": "orgpass456"
        }
        
        try:
            response = await client.post(f"{base_url}/login", json=login_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                login_response = response.json()
                print(f"   ✅ Login successful")
                org_token = login_response.get("access_token")
            else:
                print(f"   ❌ Error: {response.text}")
                org_token = None
        except Exception as e:
            print(f"   ❌ Error: {e}")
            org_token = None
        
        # Test 4: Create a gig (as organization)
        if org_token:
            print("\n4️⃣ Creating a gig...")
            headers = {"Authorization": f"Bearer {org_token}"}
            gig_data = {
                "title": "Valorant Pro Player Needed",
                "description": "Looking for a skilled Valorant player for our competitive team",
                "location": "Remote",
                "game": "Valorant",
                "budget": "₹50,000/month",
                "skills_required": ["Aim", "Game Sense", "Communication"],
                "tags": ["valorant", "competitive", "remote"],
                "status": "open"
            }
            
            try:
                response = await client.post(f"{base_url}/gigs", json=gig_data, headers=headers)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    gig_response = response.json()
                    print(f"   ✅ Gig created: {gig_response}")
                    gig_id = gig_response.get("id")
                else:
                    print(f"   ❌ Error: {response.text}")
                    gig_id = None
            except Exception as e:
                print(f"   ❌ Error: {e}")
                gig_id = None
        
        # Test 5: Login as player
        print("\n5️⃣ Logging in as player...")
        player_login_data = {
            "email": "player1@esports.com",
            "password": "securepass123"
        }
        
        try:
            response = await client.post(f"{base_url}/login", json=player_login_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                login_response = response.json()
                print(f"   ✅ Player login successful")
                player_token = login_response.get("access_token")
            else:
                print(f"   ❌ Error: {response.text}")
                player_token = None
        except Exception as e:
            print(f"   ❌ Error: {e}")
            player_token = None
        
        # Test 6: Apply to gig (as player)
        if player_token and gig_id:
            print("\n6️⃣ Applying to gig...")
            headers = {"Authorization": f"Bearer {player_token}"}
            application_data = {
                "gig_id": gig_id,
                "player_id": player_id
            }
            
            try:
                response = await client.post(f"{base_url}/apply", json=application_data, headers=headers)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    app_response = response.json()
                    print(f"   ✅ Application submitted: {app_response}")
                else:
                    print(f"   ❌ Error: {response.text}")
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        # Test 7: Browse gigs
        print("\n7️⃣ Browsing gigs...")
        try:
            response = await client.get(f"{base_url}/gigs")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                gigs_response = response.json()
                print(f"   ✅ Found {gigs_response.get('count', 0)} gigs")
                if gigs_response.get('results'):
                    for gig in gigs_response['results']:
                        print(f"      - {gig.get('title')} (ID: {gig.get('id')})")
            else:
                print(f"   ❌ Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Test 8: Endorse player (as organization)
        if org_token and player_id:
            print("\n8️⃣ Endorsing player...")
            headers = {"Authorization": f"Bearer {org_token}"}
            endorsement_data = {
                "endorsed_id": player_id,
                "rating": 5,
                "comment": "Excellent player with great communication skills!"
            }
            
            try:
                response = await client.post(f"{base_url}/endorse", json=endorsement_data, headers=headers)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    endorse_response = response.json()
                    print(f"   ✅ Player endorsed: {endorse_response}")
                else:
                    print(f"   ❌ Error: {response.text}")
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        return True

async def check_database_data():
    """Check what data was stored in the database"""
    print("\n🔍 Checking database for stored data...")
    
    try:
        from database import db
        
        # Check users collection
        print("\n👥 Users in database:")
        users_count = await db["users"].count_documents({})
        print(f"   Total users: {users_count}")
        
        # Show recent users (FastAPI users have password field)
        fastapi_users = []
        async for user in db["users"].find({"password": {"$exists": True}}):
            fastapi_users.append(user)
        
        print(f"   FastAPI users: {len(fastapi_users)}")
        for user in fastapi_users:
            print(f"      - {user.get('username')} ({user.get('email')}) - {user.get('user_type')}")
        
        # Check gigs collection
        print("\n💼 Gigs in database:")
        gigs_count = await db["gigs"].count_documents({})
        print(f"   Total gigs: {gigs_count}")
        
        async for gig in db["gigs"].find({}):
            print(f"      - {gig.get('title')} (ID: {gig.get('_id')})")
        
        # Check applications collection
        print("\n📝 Applications in database:")
        apps_count = await db["applications"].count_documents({})
        print(f"   Total applications: {apps_count}")
        
        # Check endorsements collection
        print("\n⭐ Endorsements in database:")
        endorsements_count = await db["endorsements"].count_documents({})
        print(f"   Total endorsements: {endorsements_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

async def main():
    """Main function"""
    print("🎮 FastAPI Data Storage Test")
    print("=" * 50)
    
    # Send test requests
    success = await send_test_requests()
    
    if success:
        print("\n✅ Test requests completed!")
        
        # Check database
        await check_database_data()
        
        print("\n🎉 All tests completed! Check the database for stored data.")
    else:
        print("\n❌ Test requests failed!")

if __name__ == "__main__":
    asyncio.run(main()) 