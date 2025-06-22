# backend/app/api/images.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pathlib import Path
from ..database.connection import DatabaseConnection

router = APIRouter()
db = DatabaseConnection()

# cardscrapフォルダーへのパス
CARDSCRAP_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cardscrap')

@router.get("/images/debug/card/{card_id}")
async def debug_card_image(card_id: str):
    """カード画像のデバッグ情報を取得"""
    try:
        # データベースからカード情報を取得
        card_data = db.get_card_by_id(card_id)
        
        if not card_data:
            return {
                "success": False,
                "error": f"Card not found: {card_id}",
                "card_id": card_id
            }
        
        # imgpathフィールドから画像パスを取得
        imgpath = card_data.get('imgpath')
        if not imgpath:
            return {
                "success": False,
                "error": f"Image path not found for card: {card_id}",
                "card_id": card_id,
                "card_data": card_data
            }
        
        # 相対パスを絶対パスに変換
        if imgpath.startswith('./'):
            imgpath = imgpath[2:]  # "./" を除去
        
        # cardscrapフォルダーからの絶対パスを構築
        image_path = os.path.join(CARDSCRAP_PATH, imgpath)
        
        return {
            "success": True,
            "card_id": card_id,
            "imgpath": imgpath,
            "full_image_path": image_path,
            "file_exists": os.path.exists(image_path),
            "card_data": card_data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "card_id": card_id
        }

@router.get("/images/cards/{card_id}")
async def get_card_image(card_id: str):
    """カード画像を取得"""
    try:
        # データベースからカード情報を取得
        card_data = db.get_card_by_id(card_id)
        
        if not card_data:
            raise HTTPException(status_code=404, detail=f"Card not found: {card_id}")
        
        # imgpathフィールドから画像パスを取得
        imgpath = card_data.get('imgpath')
        if not imgpath:
            raise HTTPException(status_code=404, detail=f"Image path not found for card: {card_id}")
        
        # 相対パスを絶対パスに変換
        # imgpathは "./picture/0.cardpicture/filename.png" の形式
        if imgpath.startswith('./'):
            imgpath = imgpath[2:]  # "./" を除去
        
        # cardscrapフォルダーからの絶対パスを構築
        image_path = os.path.join(CARDSCRAP_PATH, imgpath)
        
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Card image file not found: {image_path}")
        
        # ファイル名を取得
        filename = os.path.basename(image_path)
        
        return FileResponse(
            path=image_path,
            media_type="image/png",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving card image: {str(e)}")

@router.get("/images/energy/{energy_name}")
async def get_energy_image(energy_name: str):
    """エナジー画像を取得"""
    try:
        filename = f"{energy_name}.png"
        image_path = os.path.join(CARDSCRAP_PATH, 'picture', '1.required_energy', filename)
        
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Energy image not found: {energy_name}")
        
        return FileResponse(
            path=image_path,
            media_type="image/png",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving energy image: {str(e)}")

@router.get("/images/generated-energy/{energy_name}")
async def get_generated_energy_image(energy_name: str):
    """発生エナジー画像を取得"""
    try:
        filename = f"{energy_name}.png"
        image_path = os.path.join(CARDSCRAP_PATH, 'picture', '2.Generated_energy', filename)
        
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Generated energy image not found: {energy_name}")
        
        return FileResponse(
            path=image_path,
            media_type="image/png",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving generated energy image: {str(e)}")

@router.get("/images/effects/{effect_name}")
async def get_effect_image(effect_name: str):
    """効果画像を取得"""
    try:
        filename = f"{effect_name}.png"
        image_path = os.path.join(CARDSCRAP_PATH, 'picture', '3.effect', filename)
        
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Effect image not found: {effect_name}")
        
        return FileResponse(
            path=image_path,
            media_type="image/png",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving effect image: {str(e)}")

@router.get("/images/list/{image_type}")
async def list_images(image_type: str):
    """指定タイプの画像一覧を取得"""
    try:
        type_mapping = {
            "cards": "0.cardpicture",
            "energy": "1.required_energy",
            "generated_energy": "2.Generated_energy",
            "effects": "3.effect"
        }
        
        if image_type not in type_mapping:
            raise HTTPException(status_code=400, detail="Invalid image type. Use: cards, energy, generated_energy, or effects")
        
        folder_path = os.path.join(CARDSCRAP_PATH, 'picture', type_mapping[image_type])
        
        if not os.path.exists(folder_path):
            raise HTTPException(status_code=404, detail=f"Image folder not found: {image_type}")
        
        image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        return {
            "success": True,
            "data": image_files,
            "count": len(image_files),
            "message": f"Found {len(image_files)} {image_type} images"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing images: {str(e)}")