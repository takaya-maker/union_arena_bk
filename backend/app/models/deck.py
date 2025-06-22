# backend/app/models/deck.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class DeckCard(BaseModel):
    """デッキ内のカード情報"""
    card_id: str
    name: str
    card_type: Optional[str] = None
    card_term_name: Optional[str] = None
    card_rank_name: Optional[str] = None
    quantity: int = Field(ge=1, le=4)  # 1-4枚まで

class Deck(BaseModel):
    """デッキ情報"""
    id: Optional[int] = None
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    cards: List[DeckCard] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DeckCreate(BaseModel):
    """デッキ作成リクエスト"""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    cards: List[DeckCard] = []

class DeckUpdate(BaseModel):
    """デッキ更新リクエスト"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    cards: Optional[List[DeckCard]] = None

class DeckResponse(BaseModel):
    """デッキレスポンス"""
    success: bool
    data: Optional[Deck] = None
    message: str

class DecksResponse(BaseModel):
    """デッキ一覧レスポンス"""
    success: bool
    data: List[Deck] = []
    count: int = 0
    message: str 