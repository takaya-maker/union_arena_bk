# backend/cardscrap/add_card_columns.py
import sqlite3
import os
import re

def add_card_columns():
    """データベースにcard_termとcard_rankカラムを追加"""
    
    # データベースファイルのパス
    db_path = os.path.join(os.path.dirname(__file__), 'Card.db')
    
    # データベースに接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 新しいカラムを追加
        print("新しいカラムを追加中...")
        cursor.execute('ALTER TABLE card_table ADD COLUMN card_term TEXT')
        cursor.execute('ALTER TABLE card_table ADD COLUMN card_rank TEXT')
        
        # 既存のデータからcard_termとcard_rankを抽出して更新
        print("既存データからcard_termとcard_rankを抽出中...")
        
        # 全カードデータを取得
        cursor.execute('SELECT id FROM card_table')
        cards = cursor.fetchall()
        
        # card_termとcard_rankの定義
        card_terms = [
            "CGH", "HTR", "JJK", "IMS", "KMY", "TOA", "TSK", "BLC", "BTR", "MHA",
            "GNT", "BLK", "TKN", "DST", "SAO", "SYN", "TRK", "NIK", "HIQ", "BCV",
            "YYH", "GMR", "AOT", "SHY", "AND", "RLY", "GIM", "KJ8", "KMR", "WBK"
        ]
        
        card_ranks = [
            "UAPR",
            'EX01BT', 'EX02BT', 'EX03BT', 'EX04BT', 'EX05BT', 'EX06BT', 'EX07BT', 'EX08BT',
            "UA01BT", "UA02BT", "UA03BT", "UA04BT", "UA05BT", "UA06BT", "UA07BT", "UA08BT", "UA09BT", "UA10BT",
            "UA11BT", "UA12BT", "UA13BT", "UA14BT", "UA15BT", "UA16BT", "UA17BT", "UA18BT", "UA19BT", "UA20BT",
            "UA21BT", "UA22BT", "UA23BT", "UA24BT", "UA25BT", "UA26BT", "UA27BT", "UA28BT", "UA29BT", "UA30BT",
            "UA01PC", "UA02PC", "UA02NC", "UA01NC"
        ]
        
        updated_count = 0
        
        for card in cards:
            card_id = card[0]
            
            # IDからcard_rankとcard_termを抽出
            # 例: EX01BT_HTR-1-001 → card_rank: EX01BT, card_term: HTR
            parts = card_id.split('_')
            if len(parts) >= 2:
                card_rank = parts[0]
                card_term_part = parts[1]
                
                # card_termを抽出（例: HTR-1-001 → HTR）
                card_term = card_term_part.split('-')[0]
                
                # 有効なcard_rankとcard_termかチェック
                if card_rank in card_ranks and card_term in card_terms:
                    cursor.execute(
                        'UPDATE card_table SET card_term = ?, card_rank = ? WHERE id = ?',
                        (card_term, card_rank, card_id)
                    )
                    updated_count += 1
                else:
                    print(f"警告: 無効なcard_rankまたはcard_term - ID: {card_id}, rank: {card_rank}, term: {card_term}")
        
        # 変更をコミット
        conn.commit()
        print(f"更新完了: {updated_count}件のカードデータを更新しました")
        
        # 更新結果を確認
        cursor.execute('SELECT COUNT(*) FROM card_table WHERE card_term IS NOT NULL AND card_rank IS NOT NULL')
        count = cursor.fetchone()[0]
        print(f"card_termとcard_rankが設定されているカード数: {count}")
        
        # サンプルデータを表示
        cursor.execute('SELECT id, card_term, card_rank FROM card_table WHERE card_term IS NOT NULL LIMIT 5')
        samples = cursor.fetchall()
        print("\nサンプルデータ:")
        for sample in samples:
            print(f"ID: {sample[0]}, Term: {sample[1]}, Rank: {sample[2]}")
            
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("カラムは既に存在しています")
        else:
            print(f"エラー: {e}")
    except Exception as e:
        print(f"エラー: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_card_columns() 