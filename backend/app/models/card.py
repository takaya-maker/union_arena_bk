# backend/app/models/card.py
from pydantic import BaseModel
from typing import Optional

class Card(BaseModel):
    """カードデータモデル"""
    id: str
    imgpath: str
    name: str
    必要エナジー: Optional[str] = ""
    消費AP: Optional[str] = ""
    カード種類: Optional[str] = ""
    BP: Optional[str] = ""
    特徴: Optional[str] = ""
    発生エナジー: Optional[str] = ""
    効果: Optional[str] = ""
    トリガー: Optional[str] = ""

class CardSearchRequest(BaseModel):
    """カード検索リクエストモデル"""
    name: Optional[str] = None
    card_type: Optional[str] = None
    energy: Optional[str] = None

class CardResponse(BaseModel):
    """カード取得レスポンスモデル"""
    success: bool
    data: Optional[Card] = None
    message: Optional[str] = None

class CardsResponse(BaseModel):
    """複数カード取得レスポンスモデル"""
    success: bool
    data: list[Card] = []
    count: int = 0
    message: Optional[str] = None