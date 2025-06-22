# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import cards, images, decks
from fastapi.staticfiles import StaticFiles

# FastAPIアプリケーション作成
app = FastAPI(
    title="UNION ARENA API",
    description="UNION ARENA カードゲーム用API",
    version="1.0.0"
)

# CORS設定（環境変数から取得、デフォルトはlocalhost）
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:49607,https://union-arena.firebaseapp.com,https://union-arena.web.app,https://union-arena-bk.onrender.com,http://192.168.11.106:3000"

).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# cardscrapフォルダーへの絶対パスを取得
CARDSCRAP_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cardscrap')
PICTURE_PATH = os.path.join(CARDSCRAP_PATH, 'picture')

# APIルーター登録
app.include_router(cards.router, prefix="/api/v1", tags=["cards"])
app.include_router(images.router, prefix="/api/v1", tags=["images"])
app.include_router(decks.router, prefix="/api/v1", tags=["decks"])

app.mount("/static/images", StaticFiles(directory=os.path.join(PICTURE_PATH, "0.cardpicture")), name="static_images")
app.mount("/static/generated_energy", StaticFiles(directory=os.path.join(PICTURE_PATH, "2.Generated_energy")), name="static_generated_energy")
app.mount("/static/effects", StaticFiles(directory=os.path.join(PICTURE_PATH, "3.effect")), name="static_effects")
app.mount("/static/triggers", StaticFiles(directory=os.path.join(PICTURE_PATH, "4.trigger")), name="static_triggers")

@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "UNION ARENA API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "message": "API is running normally"
    }

# 開発用：利用可能なエンドポイント一覧
@app.get("/endpoints")
async def list_endpoints():
    """利用可能なエンドポイント一覧"""
    return {
        "endpoints": {
            "root": "GET /",
            "health": "GET /health",
            "all_cards": "GET /api/v1/cards",
            "card_by_id": "GET /api/v1/cards/{card_id}",
            "search_cards_post": "POST /api/v1/cards/search",
            "search_cards_get": "GET /api/v1/cards/search",
            "card_types": "GET /api/v1/card-types",
            "card_terms": "GET /api/v1/card-terms",
            "card_ranks": "GET /api/v1/card-ranks",
            "card_term_names": "GET /api/v1/card-term-names",
            "card_rank_names": "GET /api/v1/card-rank-names",
            "card_image": "GET /api/v1/images/cards/{card_id}",
            "energy_image": "GET /api/v1/images/energy/{energy_name}",
            "generated_energy_image": "GET /api/v1/images/generated-energy/{energy_name}",
            "effect_image": "GET /api/v1/images/effects/{effect_name}",
            "list_images": "GET /api/v1/images/list/{image_type}",
            "create_deck": "POST /api/v1/decks",
            "get_all_decks": "GET /api/v1/decks",
            "get_deck_by_id": "GET /api/v1/decks/{deck_id}",
            "update_deck": "PUT /api/v1/decks/{deck_id}",
            "delete_deck": "DELETE /api/v1/decks/{deck_id}"
        }
    }