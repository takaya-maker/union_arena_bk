import sqlite3
import os
from constants import CARD_TERMS, CARD_RANKS, CARD_TERM_NAMES, CARD_RANK_NAMES

class DatabaseManager:
    def __init__(self):
        """データベースマネージャーの初期化"""
        self.db_path = os.path.join(os.path.dirname(__file__), 'Card.db')
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """データベースに接続"""
        self.conn = sqlite3.connect(self.db_path)
        # UTF-8エンコーディングを設定
        self.conn.execute("PRAGMA encoding = 'UTF-8'")
        self.cursor = self.conn.cursor()
    
    def close(self):
        """データベース接続を閉じる"""
        if self.conn:
            self.conn.close()
    
    def add_card_columns(self):
        """card_term、card_rank、card_term_name、card_rank_nameカラムを追加"""
        try:
            print("=== カラム追加処理開始 ===")
            
            # 新しいカラムを追加
            print("新しいカラムを追加中...")
            self.cursor.execute('ALTER TABLE card_table ADD COLUMN card_term TEXT')
            self.cursor.execute('ALTER TABLE card_table ADD COLUMN card_rank TEXT')
            self.cursor.execute('ALTER TABLE card_table ADD COLUMN card_term_name TEXT')
            self.cursor.execute('ALTER TABLE card_table ADD COLUMN card_rank_name TEXT')
            print("✓ カラム追加完了")
            
            # 既存のデータからcard_termとcard_rankを抽出して更新
            print("既存データからcard_termとcard_rankを抽出中...")
            
            # 全カードデータを取得
            self.cursor.execute('SELECT id FROM card_table')
            cards = self.cursor.fetchall()
            
            updated_count = 0
            error_count = 0
            
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
                    if card_rank in CARD_RANKS and card_term in CARD_TERMS:
                        # 日本語名を取得
                        card_term_name = CARD_TERM_NAMES.get(card_term, card_term)
                        card_rank_name = CARD_RANK_NAMES.get(card_rank, card_rank)
                        
                        # デバッグ出力（最初の数件のみ）
                        if updated_count < 5:
                            print(f"  Updating {card_id}: term={card_term}->{card_term_name}, rank={card_rank}->{card_rank_name}")
                        
                        self.cursor.execute(
                            'UPDATE card_table SET card_term = ?, card_rank = ?, card_term_name = ?, card_rank_name = ? WHERE id = ?',
                            (card_term, card_rank, card_term_name, card_rank_name, card_id)
                        )
                        updated_count += 1
                    else:
                        print(f"警告: 無効なcard_rankまたはcard_term - ID: {card_id}, rank: {card_rank}, term: {card_term}")
                        error_count += 1
            
            # 変更をコミット
            self.conn.commit()
            print(f"✓ 更新完了: {updated_count}件のカードデータを更新しました")
            if error_count > 0:
                print(f"⚠ エラー: {error_count}件のデータで問題が発生しました")
            
            # 更新結果を確認
            self.cursor.execute('SELECT COUNT(*) FROM card_table WHERE card_term IS NOT NULL AND card_rank IS NOT NULL')
            count = self.cursor.fetchone()[0]
            print(f"✓ card_termとcard_rankが設定されているカード数: {count}")
            
            # サンプルデータを表示
            self.cursor.execute('SELECT id, card_term, card_rank, card_term_name, card_rank_name FROM card_table WHERE card_term IS NOT NULL LIMIT 5')
            samples = self.cursor.fetchall()
            print("\nサンプルデータ:")
            for sample in samples:
                print(f"  ID: {sample[0]}, Term: {sample[1]} ({sample[3]}), Rank: {sample[2]} ({sample[4]})")
            
            return True
            
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✓ カラムは既に存在しています")
                return True
            else:
                print(f"✗ エラー: {e}")
                return False
        except Exception as e:
            print(f"✗ エラー: {e}")
            return False
    
    def cleanup_database(self):
        """データベースの重複データをクリーンアップ"""
        try:
            print("\n=== データベースクリーンアップ開始 ===")
            
            # 現在のレコード数を確認
            self.cursor.execute('SELECT COUNT(*) FROM card_table')
            before_count = self.cursor.fetchone()[0]
            print(f"クリーンアップ前のレコード数: {before_count}")
            
            # 重複を排除した新テーブル作成
            print("重複データを排除中...")
            self.cursor.execute('''
                CREATE TABLE card_table_clean AS
                SELECT * FROM card_table
                WHERE ROWID IN (
                    SELECT MAX(ROWID)
                    FROM card_table
                    GROUP BY id
                )
            ''')
            
            # 重複排除後のレコード数を確認
            self.cursor.execute('SELECT COUNT(*) FROM card_table_clean')
            after_count = self.cursor.fetchone()[0]
            print(f"クリーンアップ後のレコード数: {after_count}")
            print(f"削除された重複レコード数: {before_count - after_count}")
            
            # 元テーブル削除
            self.cursor.execute('DROP TABLE card_table')
            
            # 新テーブルの名前変更
            self.cursor.execute('ALTER TABLE card_table_clean RENAME TO card_table')
            
            # コミット
            self.conn.commit()
            print("✓ データベースクリーンアップ完了")
            
            return True
            
        except Exception as e:
            print(f"✗ クリーンアップエラー: {e}")
            return False
    
    def show_database_stats(self):
        """データベースの統計情報を表示"""
        try:
            print("\n=== データベース統計情報 ===")
            
            # エンコーディング確認
            self.cursor.execute("PRAGMA encoding")
            encoding = self.cursor.fetchone()[0]
            print(f"データベースエンコーディング: {encoding}")
            
            # 総レコード数
            self.cursor.execute('SELECT COUNT(*) FROM card_table')
            total_count = self.cursor.fetchone()[0]
            print(f"総カード数: {total_count}")
            
            # card_term別の統計
            self.cursor.execute('SELECT card_term, COUNT(*) FROM card_table WHERE card_term IS NOT NULL GROUP BY card_term ORDER BY COUNT(*) DESC')
            term_stats = self.cursor.fetchall()
            print(f"\n作品別カード数:")
            for term, count in term_stats:
                print(f"  {term}: {count}枚")
            
            # card_rank別の統計
            self.cursor.execute('SELECT card_rank, COUNT(*) FROM card_table WHERE card_rank IS NOT NULL GROUP BY card_rank ORDER BY card_rank')
            rank_stats = self.cursor.fetchall()
            print(f"\nセット別カード数:")
            for rank, count in rank_stats:
                print(f"  {rank}: {count}枚")
            
            # カード種類別の統計
            self.cursor.execute('SELECT "カード種類", COUNT(*) FROM card_table WHERE "カード種類" IS NOT NULL GROUP BY "カード種類" ORDER BY COUNT(*) DESC')
            type_stats = self.cursor.fetchall()
            print(f"\nカード種類別統計:")
            for card_type, count in type_stats:
                print(f"  {card_type}: {count}枚")
            
            # 日本語名のサンプル表示
            print(f"\n日本語名サンプル:")
            self.cursor.execute('SELECT card_term_name, card_rank_name FROM card_table WHERE card_term_name IS NOT NULL LIMIT 5')
            name_samples = self.cursor.fetchall()
            for i, (term_name, rank_name) in enumerate(name_samples):
                print(f"  {i+1}: 作品={term_name}, セット={rank_name}")
            
        except Exception as e:
            print(f"✗ 統計情報取得エラー: {e}")

def main():
    """メイン処理"""
    print("UNION ARENA データベース管理ツール")
    print("=" * 50)
    
    manager = DatabaseManager()
    
    try:
        # データベースに接続
        manager.connect()
        
        # 1. カラム追加処理
        success1 = manager.add_card_columns()
        
        # 2. データベースクリーンアップ
        success2 = manager.cleanup_database()
        
        # 3. 統計情報表示
        if success1 and success2:
            manager.show_database_stats()
        
        print("\n" + "=" * 50)
        if success1 and success2:
            print("✓ すべての処理が正常に完了しました")
        else:
            print("⚠ 一部の処理でエラーが発生しました")
            
    except Exception as e:
        print(f"✗ 予期しないエラー: {e}")
    finally:
        manager.close()

if __name__ == "__main__":
    main() 