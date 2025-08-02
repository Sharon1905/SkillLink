import sys
from pathlib import Path
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

# Add the project's 'backend' directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

# Import all routers
import users, gigs, applications, endorsements, nft, messages, wallet, auth # Import auth router

app = FastAPI()

# CORS Middleware setup
origins = [
    "http://localhost",
    "http://localhost:5173", # Your frontend's development server URL
    "http://127.0.0.1:5173",  # Another common localhost variation for frontend
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://*.railway.app",  # Allow Railway domains
    "https://*.vercel.app",   # Allow Vercel domains
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount a static directory to serve uploaded files
# Ensure this 'uploads' directory exists inside your 'backend/app' folder
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include all routers
app.include_router(auth.router)  # Include auth router first
app.include_router(users.router)
app.include_router(gigs.router)
app.include_router(applications.router)
app.include_router(endorsements.router)
app.include_router(nft.router)
app.include_router(messages.router) # Include the messages router
app.include_router(wallet.router) # Include the wallet router

@app.get("/")
def root():
    return {"message": "SkillLink Backend Running"}