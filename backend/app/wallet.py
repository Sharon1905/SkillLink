from fastapi import APIRouter, HTTPException, Depends, status
from db.database import db
from users import get_current_user
import models
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from typing import List, Optional

router = APIRouter()

# Get user's wallet
@router.get("/wallet", response_model=dict)
async def get_wallet(current_user: models.User = Depends(get_current_user)):
    """Get user's wallet information"""
    try:
        # Find or create wallet for user
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        
        if not wallet:
            # Create new wallet for user
            wallet_data = {
                "user_id": ObjectId(current_user["id"]),
                "balance": 0.0,
                "locked_balance": 0.0,
                "total_earned": 0.0,
                "total_spent": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            result = await db["wallets"].insert_one(wallet_data)
            wallet = await db["wallets"].find_one({"_id": result.inserted_id})
        
        return models.wallet_helper(wallet)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get wallet")

# Get wallet transactions
@router.get("/wallet/transactions", response_model=List[dict])
async def get_wallet_transactions(
    current_user: models.User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's wallet transactions"""
    try:
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        if not wallet:
            return []
        
        transactions_cursor = db["wallet_transactions"].find(
            {"wallet_id": wallet["_id"]}
        ).sort("created_at", -1).skip(offset).limit(limit)
        
        transactions = await transactions_cursor.to_list(length=limit)
        return [models.wallet_transaction_helper(tx) for tx in transactions]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get transactions")

# Add money to wallet (for organizations)
@router.post("/wallet/deposit", response_model=dict)
async def deposit_to_wallet(
    amount: float,
    current_user: models.User = Depends(get_current_user)
):
    """Add money to wallet (dummy implementation)"""
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")
    
    try:
        # Find or create wallet
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        
        if not wallet:
            wallet_data = {
                "user_id": ObjectId(current_user["id"]),
                "balance": amount,
                "locked_balance": 0.0,
                "total_earned": 0.0,
                "total_spent": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            result = await db["wallets"].insert_one(wallet_data)
            wallet = await db["wallets"].find_one({"_id": result.inserted_id})
        else:
            # Update existing wallet
            await db["wallets"].update_one(
                {"_id": wallet["_id"]},
                {
                    "$inc": {"balance": amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            wallet = await db["wallets"].find_one({"_id": wallet["_id"]})
        
        # Create transaction record
        transaction_data = {
            "wallet_id": wallet["_id"],
            "user_id": ObjectId(current_user["id"]),
            "transaction_type": "deposit",
            "amount": amount,
            "description": f"Added ${amount:.2f} to wallet",
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(transaction_data)
        
        return {
            "message": "Deposit successful",
            "wallet": models.wallet_helper(wallet)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process deposit")

# Withdraw money from wallet (for players)
@router.post("/wallet/withdraw", response_model=dict)
async def withdraw_from_wallet(
    amount: float,
    current_user: models.User = Depends(get_current_user)
):
    """Withdraw money from wallet (dummy implementation)"""
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")
    
    try:
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        if not wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
        
        if wallet["balance"] < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")
        
        # Update wallet
        await db["wallets"].update_one(
            {"_id": wallet["_id"]},
            {
                "$inc": {"balance": -amount},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        wallet = await db["wallets"].find_one({"_id": wallet["_id"]})
        
        # Create transaction record
        transaction_data = {
            "wallet_id": wallet["_id"],
            "user_id": ObjectId(current_user["id"]),
            "transaction_type": "withdrawal",
            "amount": amount,
            "description": f"Withdrew ${amount:.2f} from wallet",
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(transaction_data)
        
        return {
            "message": "Withdrawal successful",
            "wallet": models.wallet_helper(wallet)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process withdrawal")

# Lock funds for gig (for organizations)
@router.post("/wallet/lock", response_model=dict)
async def lock_funds(
    amount: float,
    gig_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Lock funds for a gig (for organizations)"""
    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can lock funds")
    
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")
    
    try:
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        if not wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
        
        if wallet["balance"] < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")
        
        # Update wallet
        await db["wallets"].update_one(
            {"_id": wallet["_id"]},
            {
                "$inc": {"balance": -amount, "locked_balance": amount},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        wallet = await db["wallets"].find_one({"_id": wallet["_id"]})
        
        # Create transaction record
        transaction_data = {
            "wallet_id": wallet["_id"],
            "user_id": ObjectId(current_user["id"]),
            "transaction_type": "lock",
            "amount": amount,
            "description": f"Locked ${amount:.2f} for gig",
            "reference_id": gig_id,
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(transaction_data)
        
        return {
            "message": "Funds locked successfully",
            "wallet": models.wallet_helper(wallet)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to lock funds")

# Unlock funds (for organizations)
@router.post("/wallet/unlock", response_model=dict)
async def unlock_funds(
    amount: float,
    gig_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Unlock funds from a gig (for organizations)"""
    if current_user["user_type"] != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizations can unlock funds")
    
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")
    
    try:
        wallet = await db["wallets"].find_one({"user_id": ObjectId(current_user["id"])})
        if not wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
        
        if wallet["locked_balance"] < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient locked balance")
        
        # Update wallet
        await db["wallets"].update_one(
            {"_id": wallet["_id"]},
            {
                "$inc": {"balance": amount, "locked_balance": -amount},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        wallet = await db["wallets"].find_one({"_id": wallet["_id"]})
        
        # Create transaction record
        transaction_data = {
            "wallet_id": wallet["_id"],
            "user_id": ObjectId(current_user["id"]),
            "transaction_type": "unlock",
            "amount": amount,
            "description": f"Unlocked ${amount:.2f} from gig",
            "reference_id": gig_id,
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(transaction_data)
        
        return {
            "message": "Funds unlocked successfully",
            "wallet": models.wallet_helper(wallet)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to unlock funds")

# Process payment (for completed gigs)
@router.post("/wallet/payment", response_model=dict)
async def process_payment(
    application_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Process payment for a completed gig"""
    try:
        app_object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Application ID format.")
    
    application = await db["applications"].find_one({"_id": app_object_id})
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    
    # Get the associated gig
    gig = await db["gigs"].find_one({"_id": application["gig_id"]})
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated gig not found.")
    
    # Check if gig is completed
    if gig["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only process payment for completed gigs.")
    
    # Check if already paid
    if application.get("paid"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already processed.")
    
    amount = gig.get("budget", 0)
    
    try:
        # Get player's wallet
        player_wallet = await db["wallets"].find_one({"user_id": application["player_id"]})
        if not player_wallet:
            # Create wallet for player
            player_wallet_data = {
                "user_id": application["player_id"],
                "balance": amount,
                "locked_balance": 0.0,
                "total_earned": amount,
                "total_spent": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            result = await db["wallets"].insert_one(player_wallet_data)
            player_wallet = await db["wallets"].find_one({"_id": result.inserted_id})
        else:
            # Update player's wallet
            await db["wallets"].update_one(
                {"_id": player_wallet["_id"]},
                {
                    "$inc": {"balance": amount, "total_earned": amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            player_wallet = await db["wallets"].find_one({"_id": player_wallet["_id"]})
        
        # Get org's wallet and unlock funds
        org_wallet = await db["wallets"].find_one({"user_id": gig["creator_id"]})
        if org_wallet:
            await db["wallets"].update_one(
                {"_id": org_wallet["_id"]},
                {
                    "$inc": {"locked_balance": -amount, "total_spent": amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
        
        # Mark application as paid
        await db["applications"].update_one(
            {"_id": app_object_id},
            {"$set": {"paid": True, "payment_date": datetime.now(timezone.utc)}}
        )
        
        # Create transaction records
        player_transaction = {
            "wallet_id": player_wallet["_id"],
            "user_id": application["player_id"],
            "transaction_type": "payment",
            "amount": amount,
            "description": f"Payment for gig: {gig.get('title', 'Unknown')}",
            "reference_id": str(application_id),
            "status": "completed",
            "created_at": datetime.now(timezone.utc)
        }
        await db["wallet_transactions"].insert_one(player_transaction)
        
        if org_wallet:
            org_transaction = {
                "wallet_id": org_wallet["_id"],
                "user_id": gig["creator_id"],
                "transaction_type": "payment",
                "amount": -amount,
                "description": f"Payment for gig: {gig.get('title', 'Unknown')}",
                "reference_id": str(application_id),
                "status": "completed",
                "created_at": datetime.now(timezone.utc)
            }
            await db["wallet_transactions"].insert_one(org_transaction)
        
        return {
            "message": "Payment processed successfully",
            "amount": amount,
            "player_wallet": models.wallet_helper(player_wallet)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process payment") 