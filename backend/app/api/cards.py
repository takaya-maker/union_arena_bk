# backend/app/api/cards.py
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import os
from ..database.connection import DatabaseConnection
from ..models.card import Card, CardResponse, CardsResponse, CardSearchRequest

router = APIRouter()
db = DatabaseConnection()

@router.get("/cards", response_model=CardsResponse)
async def get_all_cards():
    """全カードデータを取得"""
    try:
        cards_data = db.get_all_cards()
        cards = [Card(**card_data) for card_data in cards_data]
        
        return CardsResponse(
            success=True,
            data=cards,
            count=len(cards),
            message=f"Successfully retrieved {len(cards)} cards"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cards: {str(e)}")

@router.post("/cards/search", response_model=CardsResponse)
async def search_cards(search_request: CardSearchRequest):
    """カード検索"""
    try:
        cards_data = db.search_cards(
            name=search_request.name,
            card_type=search_request.card_type,
            energy=search_request.energy
        )
        
        cards = [Card(**card_data) for card_data in cards_data]
        
        return CardsResponse(
            success=True,
            data=cards,
            count=len(cards),
            message=f"Found {len(cards)} cards matching the search criteria"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching cards: {str(e)}")

@router.get("/cards/search", response_model=CardsResponse)
async def search_cards_get(
    name: Optional[str] = Query(None, description="カード名で検索"),
    card_type: Optional[str] = Query(None, description="カード種類で検索"),
    energy: Optional[str] = Query(None, description="必要エナジーで検索"),
    card_term: Optional[str] = Query(None, description="カードシリーズ（作品）で検索"),
    card_rank: Optional[str] = Query(None, description="カードセットで検索"),
    card_term_name: Optional[str] = Query(None, description="カードシリーズ（作品）の日本語名で検索"),
    card_rank_name: Optional[str] = Query(None, description="カードセットの日本語名で検索")
):
    """カード検索（GETパラメータ版）"""
    try:
        cards_data = db.search_cards(
            name=name, 
            card_type=card_type, 
            energy=energy, 
            card_term=card_term, 
            card_rank=card_rank,
            card_term_name=card_term_name,
            card_rank_name=card_rank_name
        )
        cards = [Card(**card_data) for card_data in cards_data]
        
        return CardsResponse(
            success=True,
            data=cards,
            count=len(cards),
            message=f"Found {len(cards)} cards matching the search criteria"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching cards: {str(e)}")

@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card_by_id(card_id: str):
    """IDでカードを取得"""
    try:
        card_data = db.get_card_by_id(card_id)
        
        if not card_data:
            return CardResponse(
                success=False,
                message=f"Card with ID {card_id} not found"
            )
        
        card = Card(**card_data)
        return CardResponse(
            success=True,
            data=card,
            message=f"Successfully retrieved card {card_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card: {str(e)}")

@router.get("/card-types")
async def get_card_types():
    """カード種類一覧を取得"""
    try:
        card_types = db.get_card_types()
        return {
            "success": True,
            "data": card_types,
            "count": len(card_types),
            "message": f"Successfully retrieved {len(card_types)} card types"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card types: {str(e)}")

@router.get("/card-terms")
async def get_card_terms():
    """カードシリーズ（作品）一覧を取得"""
    try:
        card_terms = db.get_card_terms()
        return {
            "success": True,
            "data": card_terms,
            "count": len(card_terms),
            "message": f"Successfully retrieved {len(card_terms)} card terms"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card terms: {str(e)}")

@router.get("/card-ranks")
async def get_card_ranks():
    """カードセット一覧を取得"""
    try:
        card_ranks = db.get_card_ranks()
        return {
            "success": True,
            "data": card_ranks,
            "count": len(card_ranks),
            "message": f"Successfully retrieved {len(card_ranks)} card ranks"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card ranks: {str(e)}")

@router.get("/card-term-names")
async def get_card_term_names():
    """カードシリーズ（作品）の日本語名一覧を取得"""
    try:
        card_term_names = db.get_card_term_names()
        return {
            "success": True,
            "data": card_term_names,
            "count": len(card_term_names),
            "message": f"Successfully retrieved {len(card_term_names)} card term names"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card term names: {str(e)}")

@router.get("/card-rank-names")
async def get_card_rank_names():
    """カードセットの日本語名一覧を取得"""
    try:
        card_rank_names = db.get_card_rank_names()
        return {
            "success": True,
            "data": card_rank_names,
            "count": len(card_rank_names),
            "message": f"Successfully retrieved {len(card_rank_names)} card rank names"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card rank names: {str(e)}")