import sqlite3
import os
from constants import CARD_TERMS, CARD_RANKS, CARD_TERM_NAMES, CARD_RANK_NAMES

def fix_database():
    """データベースのカラム追加を手動で実行"""
    
    # データベースファイルのパス
    db_path = os.path.join(os.path.dirname(__file__), 'Card.db')
    
    print(f"データベースパス: {db_path}")
    
    # データベースに接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 現在のテーブル構造を確認
        print("=== 現在のテーブル構造 ===")
        cursor.execute("PRAGMA table_info(card_table)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # 必要なカラムを追加
        print("\n=== カラム追加処理 ===")
        
        # card_termカラムの追加
        try:
            cursor.execute('ALTER TABLE card_table ADD COLUMN card_term TEXT')
            print("✓ card_termカラムを追加しました")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ card_termカラムは既に存在しています")
            else:
                print(f"✗ card_termカラム追加エラー: {e}")
        
        # card_rankカラムの追加
        try:
            cursor.execute('ALTER TABLE card_table ADD COLUMN card_rank TEXT')
            print("✓ card_rankカラムを追加しました")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ card_rankカラムは既に存在しています")
            else:
                print(f"✗ card_rankカラム追加エラー: {e}")
        
        # card_term_nameカラムの追加
        try:
            cursor.execute('ALTER TABLE card_table ADD COLUMN card_term_name TEXT')
            print("✓ card_term_nameカラムを追加しました")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ card_term_nameカラムは既に存在しています")
            else:
                print(f"✗ card_term_nameカラム追加エラー: {e}")
        
        # card_rank_nameカラムの追加
        try:
            cursor.execute('ALTER TABLE card_table ADD COLUMN card_rank_name TEXT')
            print("✓ card_rank_nameカラムを追加しました")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ card_rank_nameカラムは既に存在しています")
            else:
                print(f"✗ card_rank_nameカラム追加エラー: {e}")
        
        # 更新後のテーブル構造を確認
        print("\n=== 更新後のテーブル構造 ===")
        cursor.execute("PRAGMA table_info(card_table)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # データ更新処理
        print("\n=== データ更新処理 ===")
        
        # 全カードデータを取得
        cursor.execute('SELECT id FROM card_table')
        cards = cursor.fetchall()
        print(f"更新対象カード数: {len(cards)}")
        
        updated_count = 0
        error_count = 0
        
        for card in cards:
            card_id = card[0]
            
            # IDからcard_rankとcard_termを抽出
            parts = card_id.split('_')
            if len(parts) >= 2:
                card_rank = parts[0]
                card_term_part = parts[1]
                
                # card_termを抽出（例: HTR-1-001 → HTR）
                card_term = card_term_part.split('-')[0]
                
                # 有効なcard_rankとcard_termかチェック
                if card_rank in CARD_RANKS and card_term in CARD_TERMS:
                    # 日本語名を取得
                    card_term_name = CARD_TERM_NAMES.get(card_term, card_term)
                    card_rank_name = CARD_RANK_NAMES.get(card_rank, card_rank)
                    
                    # デバッグ出力（最初の数件のみ）
                    if updated_count < 5:
                        print(f"  Updating {card_id}: term={card_term}->{card_term_name}, rank={card_rank}->{card_rank_name}")
                    
                    cursor.execute(
                        'UPDATE card_table SET card_term = ?, card_rank = ?, card_term_name = ?, card_rank_name = ? WHERE id = ?',
                        (card_term, card_rank, card_term_name, card_rank_name, card_id)
                    )
                    updated_count += 1
                else:
                    print(f"警告: 無効なcard_rankまたはcard_term - ID: {card_id}, rank: {card_rank}, term: {card_term}")
                    error_count += 1
        
        # 変更をコミット
        conn.commit()
        print(f"\n✓ 更新完了: {updated_count}件のカードデータを更新しました")
        if error_count > 0:
            print(f"⚠ エラー: {error_count}件のデータで問題が発生しました")
        
        # HTRデータの修正（既存データの修正）
        print("\n=== HTRデータの修正 ===")
        cursor.execute('UPDATE card_table SET card_term_name = ? WHERE card_term = ?', ("HUNTER×HUNTER", "HTR"))
        htr_updated = cursor.rowcount
        print(f"✓ HTRデータ修正完了: {htr_updated}件")
        
        # 変更をコミット
        conn.commit()
        
        # 更新結果を確認
        cursor.execute('SELECT COUNT(*) FROM card_table WHERE card_term IS NOT NULL AND card_rank IS NOT NULL')
        count = cursor.fetchone()[0]
        print(f"✓ card_termとcard_rankが設定されているカード数: {count}")
        
        # サンプルデータを表示
        cursor.execute('SELECT id, card_term, card_rank, card_term_name, card_rank_name FROM card_table WHERE card_term IS NOT NULL LIMIT 5')
        samples = cursor.fetchall()
        print("\nサンプルデータ:")
        for sample in samples:
            print(f"  ID: {sample[0]}, Term: {sample[1]} ({sample[3]}), Rank: {sample[2]} ({sample[4]})")
        
        # HTRデータの確認
        cursor.execute('SELECT id, card_term_name FROM card_table WHERE card_term = ? LIMIT 3', ("HTR",))
        htr_samples = cursor.fetchall()
        print("\nHTRデータ確認:")
        for sample in htr_samples:
            print(f"  ID: {sample[0]}, Term Name: {sample[1]}")
        
        # エンコーディング確認
        cursor.execute("PRAGMA encoding")
        encoding = cursor.fetchone()[0]
        print(f"\nデータベースエンコーディング: {encoding}")
        
    except Exception as e:
        print(f"✗ エラー: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database() 