from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from db.database import db
import models
from users import get_current_user # Import get_current_user
from schemas import MessageCreate, ConversationCreate, ConversationOut, MessageOut # Import new schemas

router = APIRouter()

# Helper to ensure a conversation exists between two participants
async def get_or_create_conversation(user1_id: ObjectId, user2_id: ObjectId):
    # Find existing conversation where both are participants
    conversation = await db["conversations"].find_one({
        "participants": {"$all": [user1_id, user2_id], "$size": 2}
    })
    
    if conversation:
        return conversation
    
    # If not found, create a new one
    new_convo_data = {
        "participants": [user1_id, user2_id],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await db["conversations"].insert_one(new_convo_data)
    created_convo = await db["conversations"].find_one({"_id": result.inserted_id})
    return created_convo

# GET all conversations for the current user
@router.get("/conversations", response_model=List[ConversationOut])
async def get_my_conversations(current_user: models.User = Depends(get_current_user)):
    user_object_id = ObjectId(current_user["id"])
    conversations_cursor = db["conversations"].find({"participants": user_object_id})
    conversations_list = await conversations_cursor.to_list(length=1000)
    
    # You might want to fetch participant names here for display in frontend
    return [models.conversation_helper(convo) for convo in conversations_list]

# GET messages within a specific conversation
@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_conversation_messages(conversation_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        convo_object_id = ObjectId(conversation_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Conversation ID format.")

    conversation = await db["conversations"].find_one({"_id": convo_object_id})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # Ensure current user is a participant in this conversation
    user_object_id = ObjectId(current_user["id"])
    if user_object_id not in conversation["participants"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this conversation.")

    messages_cursor = db["messages"].find({"conversation_id": convo_object_id}).sort("created_at", 1) # Sort by time
    messages_list = await messages_cursor.to_list(length=1000)

    # Optionally, mark messages as read when fetched
    # await db["messages"].update_many(
    #     {"conversation_id": convo_object_id, "read_by": {"$ne": user_object_id}},
    #     {"$addToSet": {"read_by": user_object_id}}
    # )
    
    return [models.message_helper(msg) for msg in messages_list]

# POST a new message to a conversation
@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(conversation_id: str, message: MessageCreate, current_user: models.User = Depends(get_current_user)):
    try:
        convo_object_id = ObjectId(conversation_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Conversation ID format.")

    conversation = await db["conversations"].find_one({"_id": convo_object_id})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # Ensure current user is a participant
    user_object_id = ObjectId(current_user["id"])
    if user_object_id not in conversation["participants"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this conversation.")

    message_dict = message.model_dump()
    message_dict["conversation_id"] = convo_object_id
    message_dict["sender_id"] = user_object_id
    message_dict["created_at"] = datetime.now(timezone.utc)
    message_dict["read_by"] = [user_object_id] # Sender has read it by default

    result = await db["messages"].insert_one(message_dict)
    created_message = await db["messages"].find_one({"_id": result.inserted_id})

    # Update conversation's updated_at timestamp
    await db["conversations"].update_one(
        {"_id": convo_object_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return models.message_helper(created_message)

# POST to start a new conversation (e.g., from a profile page)
@router.post("/conversations/start", response_model=ConversationOut)
async def start_conversation(convo_create: ConversationCreate, current_user: models.User = Depends(get_current_user)):
    try:
        recipient_object_id = ObjectId(convo_create.recipient_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Recipient ID format.")

    if recipient_object_id == ObjectId(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot start a conversation with yourself.")

    # Check if recipient exists
    recipient_user = await db["users"].find_one({"_id": recipient_object_id})
    if not recipient_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient user not found.")

    # Check if conversation already exists
    existing_convo = await db["conversations"].find_one({
        "participants": {"$all": [ObjectId(current_user["id"]), recipient_object_id], "$size": 2}
    })
    
    if existing_convo:
        return models.conversation_helper(existing_convo) # Return existing conversation
    
    # Create new conversation
    new_convo_data = {
        "participants": [ObjectId(current_user["id"]), recipient_object_id],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await db["conversations"].insert_one(new_convo_data)
    created_convo = await db["conversations"].find_one({"_id": result.inserted_id})
    
    return models.conversation_helper(created_convo)

# PATCH to mark messages in a conversation as read
@router.patch("/conversations/{conversation_id}/read")
async def mark_conversation_as_read(conversation_id: str, current_user: models.User = Depends(get_current_user)):
    try:
        convo_object_id = ObjectId(conversation_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Conversation ID format.")

    conversation = await db["conversations"].find_one({"_id": convo_object_id})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    user_object_id = ObjectId(current_user["id"])
    if user_object_id not in conversation["participants"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this conversation.")

    # Mark all messages in this conversation as read by the current user
    await db["messages"].update_many(
        {"conversation_id": convo_object_id, "read_by": {"$ne": user_object_id}},
        {"$addToSet": {"read_by": user_object_id}}
    )
    
    return {"message": "Conversation marked as read."}
