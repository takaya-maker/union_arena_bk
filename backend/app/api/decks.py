# backend/app/api/decks.py
from fastapi import APIRouter, HTTPException, Path
from typing import List
from ..database.deck_connection import DeckDatabaseConnection
from ..models.deck import Deck, DeckCreate, DeckUpdate, DeckResponse, DecksResponse

router = APIRouter()
deck_db = DeckDatabaseConnection()

@router.post("/decks", response_model=DeckResponse)
async def create_deck(deck_data: DeckCreate):
    """デッキを作成"""
    try:
        deck = deck_db.create_deck(deck_data)
        
        if deck:
            return DeckResponse(
                success=True,
                data=deck,
                message=f"デッキ '{deck.name}' を作成しました"
            )
        else:
            return DeckResponse(
                success=False,
                message="デッキの作成に失敗しました"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating deck: {str(e)}")

@router.get("/decks", response_model=DecksResponse)
async def get_all_decks():
    """全デッキを取得"""
    try:
        decks = deck_db.get_all_decks()
        
        return DecksResponse(
            success=True,
            data=decks,
            count=len(decks),
            message=f"Successfully retrieved {len(decks)} decks"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving decks: {str(e)}")

@router.get("/decks/{deck_id}", response_model=DeckResponse)
async def get_deck_by_id(deck_id: int = Path(..., description="デッキID")):
    """IDでデッキを取得"""
    try:
        deck = deck_db.get_deck_by_id(deck_id)
        
        if deck:
            return DeckResponse(
                success=True,
                data=deck,
                message=f"Successfully retrieved deck {deck_id}"
            )
        else:
            return DeckResponse(
                success=False,
                message=f"Deck with ID {deck_id} not found"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving deck: {str(e)}")

@router.put("/decks/{deck_id}", response_model=DeckResponse)
async def update_deck(deck_data: DeckUpdate, deck_id: int = Path(..., description="デッキID")):
    """デッキを更新"""
    try:
        deck = deck_db.update_deck(deck_id, deck_data)
        
        if deck:
            return DeckResponse(
                success=True,
                data=deck,
                message=f"デッキ '{deck.name}' を更新しました"
            )
        else:
            return DeckResponse(
                success=False,
                message=f"Deck with ID {deck_id} not found or update failed"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating deck: {str(e)}")

@router.delete("/decks/{deck_id}")
async def delete_deck(deck_id: int = Path(..., description="デッキID")):
    """デッキを削除"""
    try:
        success = deck_db.delete_deck(deck_id)
        
        if success:
            return {
                "success": True,
                "message": f"Deck with ID {deck_id} deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Deck with ID {deck_id} not found or delete failed"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting deck: {str(e)}") 