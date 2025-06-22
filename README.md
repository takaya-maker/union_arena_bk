# UNION ARENA カードゲーム Webアプリケーション

UNION ARENAカードゲーム用のWebアプリケーションです。カードデータの管理、デッキ構築、画像表示機能を提供します。

## 🎮 機能

- **カード管理**: UNION ARENAカードの検索・表示
- **デッキ構築**: カスタムデッキの作成・編集・削除
- **画像表示**: カード画像、エナジー画像、効果画像の表示
- **フィルタリング**: カード種類、作品、セットによる検索

## 🏗️ 技術スタック

### バックエンド
- **Python 3.8+**
- **FastAPI** - 高速なWeb APIフレームワーク
- **SQLite** - データベース
- **Uvicorn** - ASGIサーバー

### フロントエンド
- **React 18** - UIライブラリ
- **Axios** - HTTP通信
- **CSS3** - スタイリング

## 📁 プロジェクト構造

```
union-arena-webapp/
├── backend/                 # バックエンド（FastAPI）
│   ├── app/
│   │   ├── api/            # APIエンドポイント
│   │   ├── database/       # データベース接続
│   │   ├── models/         # データモデル
│   │   └── utils/          # ユーティリティ
│   ├── cardscrap/          # カードデータ・画像
│   │   └── picture/        # 画像ファイル
│   ├── requirements.txt    # Python依存関係
│   └── run.py             # サーバー起動スクリプト
├── frontend/               # フロントエンド（React）
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── services/       # API通信
│   │   └── config/         # 設定ファイル
│   ├── package.json        # Node.js依存関係
│   └── public/             # 静的ファイル
└── README.md              # このファイル
```

## 🚀 セットアップ

### 前提条件
- Python 3.8以上
- Node.js 16以上
- npm または yarn

### バックエンドセットアップ

1. バックエンドディレクトリに移動
```bash
cd backend
```

2. 仮想環境を作成・アクティベート
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. 依存関係をインストール
```bash
pip install -r requirements.txt
```

4. サーバーを起動
```bash
python run.py
```

バックエンドサーバーは `http://localhost:8000` で起動します。

### フロントエンドセットアップ

1. フロントエンドディレクトリに移動
```bash
cd frontend
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm start
```

フロントエンドアプリケーションは `http://localhost:3000` で起動します。

## 📚 API ドキュメント

サーバー起動後、以下のURLでAPIドキュメントを確認できます：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 主要エンドポイント

#### カード関連
- `GET /api/v1/cards` - 全カード取得
- `GET /api/v1/cards/{card_id}` - 特定カード取得
- `GET /api/v1/cards/search` - カード検索
- `GET /api/v1/card-types` - カード種類一覧
- `GET /api/v1/card-terms` - 作品一覧

#### 画像関連
- `GET /api/v1/images/cards/{card_id}` - カード画像
- `GET /api/v1/images/energy/{energy_name}` - エナジー画像
- `GET /api/v1/images/effects/{effect_name}` - 効果画像

#### デッキ関連
- `GET /api/v1/decks` - 全デッキ取得
- `POST /api/v1/decks` - デッキ作成
- `PUT /api/v1/decks/{deck_id}` - デッキ更新
- `DELETE /api/v1/decks/{deck_id}` - デッキ削除

## 🎯 使用方法

1. アプリケーションを起動
2. カード一覧からカードを検索・閲覧
3. デッキビルダーでカスタムデッキを作成
4. デッキの保存・編集・削除

## 🔧 開発

### 環境変数

バックエンド:
- `ALLOWED_ORIGINS` - CORS許可オリジン（デフォルト: localhost:3000）

フロントエンド:
- `REACT_APP_API_BASE_URL` - APIベースURL（デフォルト: http://localhost:8000）

### データベース

カードデータは `backend/cardscrap/Card.db` に保存されています。
データベーススキーマ:
```sql
CREATE TABLE card_table (
    id TEXT PRIMARY KEY,
    imgpath TEXT,
    name TEXT,
    必要エナジー TEXT,
    消費AP TEXT,
    カード種類 TEXT,
    BP TEXT,
    特徴 TEXT,
    発生エナジー TEXT,
    効果 TEXT,
    トリガー TEXT,
    card_term TEXT,
    card_rank TEXT,
    card_term_name TEXT,
    card_rank_name TEXT
);
```

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。 
