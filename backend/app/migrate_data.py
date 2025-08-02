#!/usr/bin/env python3
"""
Migrate data from skilllink database to versatile_db database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_data():
    """Migrate data from skilllink to versatile_db"""
    print("🔄 Migrating data from skilllink to versatile_db...")
    
    # Connect to both databases
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    skilllink_db = client["skilllink"]
    versatile_db = client["versatile_db"]
    
    try:
        # Migrate users
        print("\n👥 Migrating users...")
        users_count = await skilllink_db["users"].count_documents({})
        print(f"   Found {users_count} users in skilllink")
        
        if users_count > 0:
            # Check for duplicates
            async for user in skilllink_db["users"].find({}):
                email = user.get("email")
                existing_user = await versatile_db["users"].find_one({"email": email})
                
                if not existing_user:
                    # Insert user into versatile_db
                    await versatile_db["users"].insert_one(user)
                    print(f"   ✅ Migrated user: {user.get('username')} ({email})")
                else:
                    print(f"   ⚠️ User already exists: {user.get('username')} ({email})")
        
        # Migrate gigs
        print("\n💼 Migrating gigs...")
        gigs_count = await skilllink_db["gigs"].count_documents({})
        print(f"   Found {gigs_count} gigs in skilllink")
        
        if gigs_count > 0:
            async for gig in skilllink_db["gigs"].find({}):
                # Check for duplicates by title and org_id
                existing_gig = await versatile_db["gigs"].find_one({
                    "title": gig.get("title"),
                    "org_id": gig.get("org_id")
                })
                
                if not existing_gig:
                    await versatile_db["gigs"].insert_one(gig)
                    print(f"   ✅ Migrated gig: {gig.get('title')}")
                else:
                    print(f"   ⚠️ Gig already exists: {gig.get('title')}")
        
        # Migrate applications
        print("\n📝 Migrating applications...")
        apps_count = await skilllink_db["applications"].count_documents({})
        print(f"   Found {apps_count} applications in skilllink")
        
        if apps_count > 0:
            async for app in skilllink_db["applications"].find({}):
                # Check for duplicates by gig_id and player_id
                existing_app = await versatile_db["applications"].find_one({
                    "gig_id": app.get("gig_id"),
                    "player_id": app.get("player_id")
                })
                
                if not existing_app:
                    await versatile_db["applications"].insert_one(app)
                    print(f"   ✅ Migrated application: {app.get('_id')}")
                else:
                    print(f"   ⚠️ Application already exists: {app.get('_id')}")
        
        # Migrate endorsements
        print("\n⭐ Migrating endorsements...")
        endorsements_count = await skilllink_db["endorsements"].count_documents({})
        print(f"   Found {endorsements_count} endorsements in skilllink")
        
        if endorsements_count > 0:
            async for endorsement in skilllink_db["endorsements"].find({}):
                # Check for duplicates by endorsed_id and endorsed_by
                existing_endorsement = await versatile_db["endorsements"].find_one({
                    "endorsed_id": endorsement.get("endorsed_id"),
                    "endorsed_by": endorsement.get("endorsed_by")
                })
                
                if not existing_endorsement:
                    await versatile_db["endorsements"].insert_one(endorsement)
                    print(f"   ✅ Migrated endorsement: {endorsement.get('_id')}")
                else:
                    print(f"   ⚠️ Endorsement already exists: {endorsement.get('_id')}")
        
        # Show final counts
        print("\n📊 Final counts in versatile_db:")
        users_final = await versatile_db["users"].count_documents({})
        gigs_final = await versatile_db["gigs"].count_documents({})
        apps_final = await versatile_db["applications"].count_documents({})
        endorsements_final = await versatile_db["endorsements"].count_documents({})
        
        print(f"   Users: {users_final}")
        print(f"   Gigs: {gigs_final}")
        print(f"   Applications: {apps_final}")
        print(f"   Endorsements: {endorsements_final}")
        
        print("\n✅ Migration completed!")
        print("🎯 All data is now in the versatile_db database!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False

async def main():
    """Main function"""
    print("🚀 Data Migration Tool")
    print("=" * 40)
    
    success = await migrate_data()
    
    if success:
        print("\n🎉 Migration successful!")
        print("💡 Now restart the FastAPI server to use versatile_db")
    else:
        print("\n❌ Migration failed!")

if __name__ == "__main__":
    asyncio.run(main()) 