import sqlite3
import os

def db_clean():
    # DBファイルのパス
    db_path = os.path.join(os.path.dirname(__file__), 'Card.db')

    # 接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 重複を排除した新テーブル作成
    cursor.execute('''
        CREATE TABLE card_table_clean AS
        SELECT * FROM card_table
        WHERE ROWID IN (
            SELECT MAX(ROWID)
            FROM card_table
            GROUP BY id
        )
    ''')

    # 元テーブル削除
    cursor.execute('DROP TABLE card_table')

    # 新テーブルの名前変更
    cursor.execute('ALTER TABLE card_table_clean RENAME TO card_table')

    # コミット＆クローズ
    conn.commit()
    conn.close()

    print("データ整理完了しました。")

