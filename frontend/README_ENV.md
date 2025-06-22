# 環境設定について

## 概要
このプロジェクトでは、セキュリティを向上させるため、IPアドレスなどの設定を環境変数で管理しています。

## フロントエンド設定

### 環境変数
以下の環境変数を設定することで、APIの接続先を変更できます：

```bash
# 開発環境用
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_IMAGE_BASE_URL=http://localhost:8000/api/v1/images

# 本番環境用
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_IMAGE_BASE_URL=/api/v1/images
```

### 設定ファイル
`src/config/config.js` で環境に応じた設定を管理しています：

- **開発環境**: `localhost:8000` を使用
- **本番環境**: 相対パスを使用（プロキシ設定を想定）

## バックエンド設定

### CORS設定
環境変数 `ALLOWED_ORIGINS` で許可するオリジンを設定できます：

```bash
# 複数のオリジンをカンマ区切りで指定
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://your-domain.com
```

### デフォルト設定
- フロントエンド: `http://localhost:3000,http://127.0.0.1:3000`
- バックエンド: `http://localhost:8000`

## 使用方法

### 開発環境
1. フロントエンドとバックエンドを同じマシンで実行する場合：
   - デフォルト設定のまま使用可能

2. 異なるマシンで実行する場合：
   ```bash
   # フロントエンド側
   export REACT_APP_API_BASE_URL=http://192.168.1.100:8000/api/v1
   export REACT_APP_IMAGE_BASE_URL=http://192.168.1.100:8000/api/v1/images
   
   # バックエンド側
   export ALLOWED_ORIGINS=http://192.168.1.101:3000
   ```

### 本番環境
- プロキシ設定を使用することを推奨
- 環境変数で適切なドメインを設定

## セキュリティ上の利点
- IPアドレスがハードコーディングされていない
- 環境に応じた設定が可能
- 設定変更時にコードの修正が不要 