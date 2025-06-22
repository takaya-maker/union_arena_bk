# backend/app/database/deck_connection.py
import sqlite3
import json
import os
from typing import List, Dict, Optional
from datetime import datetime
from ..models.deck import Deck, DeckCard, DeckCreate, DeckUpdate

class DeckDatabaseConnection:
    def __init__(self):
        # メインのCard.dbと同じディレクトリにdeck.dbを作成
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cardscrap', 'deck.db')
        self.init_database()
        
    def init_database(self):
        """デッキデータベースの初期化"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # デッキテーブル作成
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS decks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                cards TEXT NOT NULL,  -- JSON形式でカード情報を保存
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_connection(self):
        """データベース接続を取得"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA encoding = 'UTF-8'")
        return conn
    
    def create_deck(self, deck_data: DeckCreate) -> Optional[Deck]:
        """デッキを作成"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # カード情報をJSON形式で保存
            cards_json = json.dumps([card.dict() for card in deck_data.cards], ensure_ascii=False)
            
            cursor.execute('''
                INSERT INTO decks (name, description, cards, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (deck_data.name, deck_data.description, cards_json, datetime.now(), datetime.now()))
            
            deck_id = cursor.lastrowid
            conn.commit()
            
            # 作成したデッキを取得
            return self.get_deck_by_id(deck_id)
            
        except Exception as e:
            print(f"Error creating deck: {e}")
            return None
        finally:
            conn.close()
    
    def get_deck_by_id(self, deck_id: int) -> Optional[Deck]:
        """IDでデッキを取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM decks WHERE id = ?', (deck_id,))
            row = cursor.fetchone()
            
            if row:
                return self._row_to_deck(row)
            return None
            
        except Exception as e:
            print(f"Error fetching deck {deck_id}: {e}")
            return None
        finally:
            conn.close()
    
    def get_all_decks(self) -> List[Deck]:
        """全デッキを取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM decks ORDER BY updated_at DESC')
            rows = cursor.fetchall()
            
            decks = []
            for row in rows:
                deck = self._row_to_deck(row)
                if deck:
                    decks.append(deck)
            
            return decks
            
        except Exception as e:
            print(f"Error fetching all decks: {e}")
            return []
        finally:
            conn.close()
    
    def update_deck(self, deck_id: int, deck_data: DeckUpdate) -> Optional[Deck]:
        """デッキを更新"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # 更新するフィールドを動的に構築
            update_fields = []
            params = []
            
            if deck_data.name is not None:
                update_fields.append("name = ?")
                params.append(deck_data.name)
            
            if deck_data.description is not None:
                update_fields.append("description = ?")
                params.append(deck_data.description)
            
            if deck_data.cards is not None:
                update_fields.append("cards = ?")
                cards_json = json.dumps([card.dict() for card in deck_data.cards], ensure_ascii=False)
                params.append(cards_json)
            
            update_fields.append("updated_at = ?")
            params.append(datetime.now())
            params.append(deck_id)
            
            if update_fields:
                query = f"UPDATE decks SET {', '.join(update_fields)} WHERE id = ?"
                cursor.execute(query, params)
                conn.commit()
                
                return self.get_deck_by_id(deck_id)
            
            return None
            
        except Exception as e:
            print(f"Error updating deck {deck_id}: {e}")
            return None
        finally:
            conn.close()
    
    def delete_deck(self, deck_id: int) -> bool:
        """デッキを削除"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('DELETE FROM decks WHERE id = ?', (deck_id,))
            conn.commit()
            return cursor.rowcount > 0
            
        except Exception as e:
            print(f"Error deleting deck {deck_id}: {e}")
            return False
        finally:
            conn.close()
    
    def _row_to_deck(self, row) -> Optional[Deck]:
        """データベース行をDeckオブジェクトに変換"""
        try:
            deck_id, name, description, cards_json, created_at, updated_at = row
            
            # JSONからカード情報を復元
            cards_data = json.loads(cards_json)
            cards = [DeckCard(**card_data) for card_data in cards_data]
            
            return Deck(
                id=deck_id,
                name=name,
                description=description,
                cards=cards,
                created_at=datetime.fromisoformat(created_at) if created_at else None,
                updated_at=datetime.fromisoformat(updated_at) if updated_at else None
            )
            
        except Exception as e:
            print(f"Error converting row to deck: {e}")
            return None 