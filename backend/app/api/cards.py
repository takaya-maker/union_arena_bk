# backend/app/api/cards.py
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import os
from ..database.connection import DatabaseConnection
from ..models.card import Card, CardResponse, CardsResponse, CardSearchRequest

router = APIRouter()
db = DatabaseConnection()

# backend/app/api/cards.py (大量データ対応版)
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import JSONResponse
import sqlite3
import json
from ..database.connection import get_db_connection

router = APIRouter()

@router.get("/cards")
async def get_all_cards(
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(100, ge=1, le=1000, description="1ページあたりの件数"),
    minimal: bool = Query(False, description="最小限の情報のみ取得")
):
    """
    全カード取得API（大量データ対応）
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 総件数取得
        cursor.execute("SELECT COUNT(*) FROM card_table")
        total_count = cursor.fetchone()[0]
        
        # データ取得
        offset = (page - 1) * limit
        
        if minimal:
            # 最小限の情報のみ（一覧表示用）
            query = """
                SELECT id, name, "カード種類", "BP", imgpath
                FROM card_table 
                ORDER BY id
                LIMIT ? OFFSET ?
            """
            columns = ['id', 'name', 'カード種類', 'BP', 'imgpath']
        else:
            # 全情報
            query = """
                SELECT 
                    id, imgpath, name, "必要エナジー", "消費AP", 
                    "カード種類", "BP", "特徴", "発生エナジー", 
                    "効果", "トリガー"
                FROM card_table 
                ORDER BY id
                LIMIT ? OFFSET ?
            """
            columns = [
                'id', 'imgpath', 'name', '必要エナジー', '消費AP',
                'カード種類', 'BP', '特徴', '発生エナジー', '効果', 'トリガー'
            ]
        
        cursor.execute(query, [limit, offset])
        rows = cursor.fetchall()
        
        # 結果を辞書形式に変換
        cards = []
        for row in rows:
            card_dict = dict(zip(columns, row))
            cards.append(card_dict)
        
        conn.close()
        
        return JSONResponse({
            "success": True,
            "data": cards,
            "count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
            "has_next": page * limit < total_count,
            "has_prev": page > 1,
            "minimal": minimal
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "カード取得中にエラーが発生しました"
            }
        )

@router.get("/cards/search")
async def search_cards(
    name: Optional[str] = Query(None, description="カード名での検索"),
    card_type: Optional[str] = Query(None, description="カード種類"),
    energy: Optional[str] = Query(None, description="必要エナジー"),
    card_term: Optional[str] = Query(None, description="作品略称"),
    card_rank: Optional[str] = Query(None, description="セット略称"),
    card_term_name: Optional[str] = Query(None, description="作品日本語名"),
    card_rank_name: Optional[str] = Query(None, description="セット日本語名"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(500, ge=1, le=2000, description="1ページあたりの件数（検索時は多めに設定可能）"),
    minimal: bool = Query(False, description="最小限の情報のみ取得")
):
    """
    カード検索API（大量データ対応）
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # WHERE条件とパラメータを構築
        where_conditions = []
        params = []
        
        if name:
            where_conditions.append("name LIKE ?")
            params.append(f"%{name}%")
            
        if card_type:
            where_conditions.append("\"カード種類\" = ?")
            params.append(card_type)
            
        if energy:
            where_conditions.append("\"必要エナジー\" LIKE ?")
            params.append(f"%{energy}%")
            
        if card_term:
            where_conditions.append("id LIKE ?")
            params.append(f"%{card_term}%")
            
        if card_rank:
            where_conditions.append("id LIKE ?")
            params.append(f"%{card_rank}%")
            
        if card_term_name:
            where_conditions.append("\"特徴\" LIKE ?")
            params.append(f"%{card_term_name}%")
            
        if card_rank_name:
            where_conditions.append("\"効果\" LIKE ? OR \"トリガー\" LIKE ?")
            params.extend([f"%{card_rank_name}%", f"%{card_rank_name}%"])
        
        # WHERE句を構築
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # 全件数取得
        count_query = f"SELECT COUNT(*) FROM card_table {where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # データ取得
        offset = (page - 1) * limit
        
        if minimal:
            data_query = f"""
                SELECT id, name, "カード種類", "BP", imgpath
                FROM card_table 
                {where_clause}
                ORDER BY 
                    CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                    id
                LIMIT ? OFFSET ?
            """
            search_params = params + [f"%{name}%" if name else "%", limit, offset]
            columns = ['id', 'name', 'カード種類', 'BP', 'imgpath']
        else:
            data_query = f"""
                SELECT 
                    id, imgpath, name, "必要エナジー", "消費AP", 
                    "カード種類", "BP", "特徴", "発生エナジー", 
                    "効果", "トリガー"
                FROM card_table 
                {where_clause}
                ORDER BY 
                    CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                    id
                LIMIT ? OFFSET ?
            """
            search_params = params + [f"%{name}%" if name else "%", limit, offset]
            columns = [
                'id', 'imgpath', 'name', '必要エナジー', '消費AP',
                'カード種類', 'BP', '特徴', '発生エナジー', '効果', 'トリガー'
            ]
        
        cursor.execute(data_query, search_params)
        rows = cursor.fetchall()
        
        # 結果を辞書形式に変換
        cards = []
        for row in rows:
            card_dict = dict(zip(columns, row))
            cards.append(card_dict)
        
        conn.close()
        
        return JSONResponse({
            "success": True,
            "data": cards,
            "count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
            "has_next": page * limit < total_count,
            "has_prev": page > 1,
            "minimal": minimal,
            "search_params": {
                "name": name,
                "card_type": card_type,
                "energy": energy,
                "card_term": card_term,
                "card_rank": card_rank,
                "card_term_name": card_term_name,
                "card_rank_name": card_rank_name
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "検索中にエラーが発生しました"
            }
        )

@router.get("/cards/stats")
async def get_card_stats():
    """
    カード統計情報取得API（ダッシュボード用）
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 総件数
        cursor.execute("SELECT COUNT(*) FROM card_table")
        total_cards = cursor.fetchone()[0]
        
        # カード種類別件数
        cursor.execute("""
            SELECT "カード種類", COUNT(*) 
            FROM card_table 
            GROUP BY "カード種類" 
            ORDER BY COUNT(*) DESC
        """)
        card_types = dict(cursor.fetchall())
        
        # 作品別件数（IDから推定）
        cursor.execute("""
            SELECT 
                substr(id, instr(id, '_') + 1, instr(substr(id, instr(id, '_') + 1), '-') - 1) as series,
                COUNT(*) 
            FROM card_table 
            WHERE id LIKE '%_%-%'
            GROUP BY series
            ORDER BY COUNT(*) DESC
            LIMIT 20
        """)
        series_stats = dict(cursor.fetchall())
        
        conn.close()
        
        return JSONResponse({
            "success": True,
            "stats": {
                "total_cards": total_cards,
                "card_types": card_types,
                "series_stats": series_stats,
                "last_updated": "2025-06-26"
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "統計情報取得中にエラーが発生しました"
            }
        )

@router.get("/cards/search")
async def search_cards(
    name: Optional[str] = Query(None, description="カード名での検索"),
    card_type: Optional[str] = Query(None, description="カード種類"),
    energy: Optional[str] = Query(None, description="必要エナジー"),
    card_term: Optional[str] = Query(None, description="作品略称"),
    card_rank: Optional[str] = Query(None, description="セット略称"),
    card_term_name: Optional[str] = Query(None, description="作品日本語名"),
    card_rank_name: Optional[str] = Query(None, description="セット日本語名"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(500, ge=1, le=2000, description="1ページあたりの件数（検索時は多めに設定可能）"),
    minimal: bool = Query(False, description="最小限の情報のみ取得")
):
    """
    カード検索API（大量データ対応）
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # WHERE条件とパラメータを構築
        where_conditions = []
        params = []
        
        if name:
            where_conditions.append("name LIKE ?")
            params.append(f"%{name}%")
            
        if card_type:
            where_conditions.append("\"カード種類\" = ?")
            params.append(card_type)
            
        if energy:
            where_conditions.append("\"必要エナジー\" LIKE ?")
            params.append(f"%{energy}%")
            
        if card_term:
            where_conditions.append("id LIKE ?")
            params.append(f"%{card_term}%")
            
        if card_rank:
            where_conditions.append("id LIKE ?")
            params.append(f"%{card_rank}%")
            
        if card_term_name:
            where_conditions.append("\"特徴\" LIKE ?")
            params.append(f"%{card_term_name}%")
            
        if card_rank_name:
            where_conditions.append("\"効果\" LIKE ? OR \"トリガー\" LIKE ?")
            params.extend([f"%{card_rank_name}%", f"%{card_rank_name}%"])
        
        # WHERE句を構築
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # 全件数取得
        count_query = f"SELECT COUNT(*) FROM card_table {where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # データ取得
        offset = (page - 1) * limit
        
        if minimal:
            data_query = f"""
                SELECT id, name, "カード種類", "BP", imgpath
                FROM card_table 
                {where_clause}
                ORDER BY 
                    CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                    id
                LIMIT ? OFFSET ?
            """
            search_params = params + [f"%{name}%" if name else "%", limit, offset]
            columns = ['id', 'name', 'カード種類', 'BP', 'imgpath']
        else:
            data_query = f"""
                SELECT 
                    id, imgpath, name, "必要エナジー", "消費AP", 
                    "カード種類", "BP", "特徴", "発生エナジー", 
                    "効果", "トリガー"
                FROM card_table 
                {where_clause}
                ORDER BY 
                    CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                    id
                LIMIT ? OFFSET ?
            """
            search_params = params + [f"%{name}%" if name else "%", limit, offset]
            columns = [
                'id', 'imgpath', 'name', '必要エナジー', '消費AP',
                'カード種類', 'BP', '特徴', '発生エナジー', '効果', 'トリガー'
            ]
        
        cursor.execute(data_query, search_params)
        rows = cursor.fetchall()
        
        # 結果を辞書形式に変換
        cards = []
        for row in rows:
            card_dict = dict(zip(columns, row))
            cards.append(card_dict)
        
        conn.close()
        
        return JSONResponse({
            "success": True,
            "data": cards,
            "count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
            "has_next": page * limit < total_count,
            "has_prev": page > 1,
            "minimal": minimal,
            "search_params": {
                "name": name,
                "card_type": card_type,
                "energy": energy,
                "card_term": card_term,
                "card_rank": card_rank,
                "card_term_name": card_term_name,
                "card_rank_name": card_rank_name
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "検索中にエラーが発生しました"
            }
        )

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
    

@router.get("/cards/stats")
async def get_card_stats():
    """
    カード統計情報取得API（ダッシュボード用）
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 総件数
        cursor.execute("SELECT COUNT(*) FROM card_table")
        total_cards = cursor.fetchone()[0]
        
        # カード種類別件数
        cursor.execute("""
            SELECT "カード種類", COUNT(*) 
            FROM card_table 
            GROUP BY "カード種類" 
            ORDER BY COUNT(*) DESC
        """)
        card_types = dict(cursor.fetchall())
        
        # 作品別件数（IDから推定）
        cursor.execute("""
            SELECT 
                substr(id, instr(id, '_') + 1, instr(substr(id, instr(id, '_') + 1), '-') - 1) as series,
                COUNT(*) 
            FROM card_table 
            WHERE id LIKE '%_%-%'
            GROUP BY series
            ORDER BY COUNT(*) DESC
            LIMIT 20
        """)
        series_stats = dict(cursor.fetchall())
        
        conn.close()
        
        return JSONResponse({
            "success": True,
            "stats": {
                "total_cards": total_cards,
                "card_types": card_types,
                "series_stats": series_stats,
                "last_updated": "2025-06-26"
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "統計情報取得中にエラーが発生しました"
            }
        )