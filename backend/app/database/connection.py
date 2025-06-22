# backend/app/database/connection.py
import sqlite3
import os
from typing import List, Dict, Optional

class DatabaseConnection:
    def __init__(self):
        # cardscrapフォルダーのCard.dbへのパスを設定
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cardscrap', 'Card.db')
        
    def get_connection(self):
        """データベース接続を取得"""
        conn = sqlite3.connect(self.db_path)
        # UTF-8エンコーディングを設定
        conn.execute("PRAGMA encoding = 'UTF-8'")
        return conn
    
    def get_all_cards(self) -> List[Dict]:
        """全カードデータを取得"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row  # 辞書形式で結果を取得
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM card_table')
            cards = cursor.fetchall()
            # Row オブジェクトを辞書に変換
            result = [dict(card) for card in cards]
            return result
        except Exception as e:
            print(f"Error fetching cards: {e}")
            return []
        finally:
            conn.close()
    
    def get_card_by_id(self, card_id: str) -> Optional[Dict]:
        """IDでカードを取得"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM card_table WHERE id = ?', (card_id,))
            card = cursor.fetchone()
            return dict(card) if card else None
        except Exception as e:
            print(f"Error fetching card {card_id}: {e}")
            return None
        finally:
            conn.close()
    
    def search_cards(self, name: str = None, card_type: str = None, energy: str = None, card_term: str = None, card_rank: str = None, card_term_name: str = None, card_rank_name: str = None) -> List[Dict]:
        """カード検索"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM card_table WHERE 1=1"
        params = []
        
        if name:
            query += " AND name LIKE ?"
            params.append(f"%{name}%")

        if card_type:
            query += ' AND "カード種類" = ?'
            params.append(card_type)

        if energy:
            query += ' AND "必要エナジー" LIKE ?'
            params.append(f"%{energy}%")

        if card_term:
            query += ' AND card_term = ?'
            params.append(card_term)

        if card_rank:
            query += ' AND card_rank = ?'
            params.append(card_rank)

        if card_term_name:
            query += ' AND card_term_name LIKE ?'
            params.append(f"%{card_term_name}%")

        if card_rank_name:
            query += ' AND card_rank_name LIKE ?'
            params.append(f"%{card_rank_name}%")

        # デバッグ出力（エンコーディング確認）
        print('search query :', query)
        print('parameters   :', [param.encode('utf-8') if isinstance(param, str) else param for param in params])
        print('raw params   :', params)

        try:
            cursor.execute(query, params)
            cards = cursor.fetchall()
            return [dict(card) for card in cards]
        except Exception as e:
            print(f"Error searching cards: {e}")
            return []
        finally:
            conn.close()
    
    def get_card_types(self) -> List[str]:
        """カード種類の一覧を取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT DISTINCT "カード種類" FROM card_table WHERE "カード種類" IS NOT NULL')
            types = cursor.fetchall()
            return [t[0] for t in types if t[0]]
        except Exception as e:
            print(f"Error fetching card types: {e}")
            return []
        finally:
            conn.close()

    def get_card_terms(self) -> List[str]:
        """カードシリーズ（作品）の一覧を取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT DISTINCT card_term FROM card_table WHERE card_term IS NOT NULL ORDER BY card_term')
            terms = cursor.fetchall()
            return [t[0] for t in terms if t[0]]
        except Exception as e:
            print(f"Error fetching card terms: {e}")
            return []
        finally:
            conn.close()

    def get_card_ranks(self) -> List[str]:
        """カードセットの一覧を取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT DISTINCT card_rank FROM card_table WHERE card_rank IS NOT NULL ORDER BY card_rank')
            ranks = cursor.fetchall()
            return [r[0] for r in ranks if r[0]]
        except Exception as e:
            print(f"Error fetching card ranks: {e}")
            return []
        finally:
            conn.close()

    def get_card_term_names(self) -> List[str]:
        """カードシリーズ（作品）の日本語名一覧を取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT DISTINCT card_term_name FROM card_table WHERE card_term_name IS NOT NULL ORDER BY card_term_name')
            term_names = cursor.fetchall()
            return [t[0] for t in term_names if t[0]]
        except Exception as e:
            print(f"Error fetching card term names: {e}")
            return []
        finally:
            conn.close()

    def get_card_rank_names(self) -> List[str]:
        """カードセットの日本語名一覧を取得"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT DISTINCT card_rank_name FROM card_table WHERE card_rank_name IS NOT NULL ORDER BY card_rank_name')
            rank_names = cursor.fetchall()
            return [r[0] for r in rank_names if r[0]]
        except Exception as e:
            print(f"Error fetching card rank names: {e}")
            return []
        finally:
            conn.close()

    def check_database_encoding(self):
        """データベースの文字エンコーディングを確認"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # エンコーディング設定を確認
            cursor.execute("PRAGMA encoding")
            encoding = cursor.fetchone()[0]
            print(f"Database encoding: {encoding}")
            
            # サンプルデータでエンコーディングを確認
            cursor.execute('SELECT card_term_name FROM card_table WHERE card_term_name IS NOT NULL LIMIT 5')
            samples = cursor.fetchall()
            print("Sample card_term_name values:")
            for i, sample in enumerate(samples):
                print(f"  {i+1}: {sample[0]} (bytes: {sample[0].encode('utf-8') if sample[0] else 'None'})")
                
        except Exception as e:
            print(f"Error checking database encoding: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    db = DatabaseConnection()
    # データベースエンコーディングを確認
    db.check_database_encoding()
    
    # print(db.db_path)
    cards_data = db.get_all_cards()
    # print(cards_data)
    # cards = [Card(**card_data) for card_data in cards_data]

    cards = db.search_cards(name="C.C.", card_type="キャラクター", energy="青1")
    # print(cards)
    