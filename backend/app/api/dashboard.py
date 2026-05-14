from fastapi import APIRouter
from app.api.properties import load_properties
from app.core.database import get_database

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard():
    db = get_database()
    properties = await load_properties()
    try:
        saved_docs = await db.saved_properties.find({}, {"_id": 0}).to_list(length=200)
        predictions = await db.prediction_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=10)
        recommendations = await db.recommendation_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=10)
    except Exception:
        saved_docs = []
        predictions = []
        recommendations = []

    saved_ids = {doc["property_id"] for doc in saved_docs}
    saved = [item for item in properties if item.get("saved") or item["id"] in saved_ids]

    return {
        "stats": {
            "saved": len(saved),
            "predictions": len(predictions),
            "recommendations": len(recommendations),
            "average_price": round(sum(item["price"] for item in properties) / len(properties)),
        },
        "saved_properties": saved,
        "prediction_history": predictions,
        "recommendation_history": recommendations,
        "charts": {},
    }
