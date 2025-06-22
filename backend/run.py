# backend/run.py
import uvicorn
from app.main import app
from fastapi.staticfiles import StaticFiles
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount(
    "/static/generated_energy",
    StaticFiles(directory=os.path.join(BASE_DIR, "cardscrap/picture/2.Generated_energy")),
    name="static_generated_energy"
)
app.mount(
    "/static/effects",
    StaticFiles(directory=os.path.join(BASE_DIR, "cardscrap/picture/3.effect")),
    name="static_effects"
)
app.mount(
    "/static/triggers",
    StaticFiles(directory=os.path.join(BASE_DIR, "cardscrap/picture/4.trigger")),
    name="static_triggers"
)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 開発時の自動リロード
        log_level="info"
    )