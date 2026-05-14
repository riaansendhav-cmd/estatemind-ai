from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.api.properties import load_properties
from app.core.database import get_database
from app.ml.recommender import recommend

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    budget: int = Field(ge=1000000)
    location: str = ""
    bedrooms: int = Field(default=3, ge=1, le=10)
    amenities: list[str] = Field(default_factory=list)


@router.post("")
async def get_recommendations(payload: RecommendationRequest):
    preferences = payload.model_dump()
    properties = await load_properties()
    results = recommend(properties, preferences)
    db = get_database()
    try:
        await db.recommendation_history.insert_one(
            {
                "preferences": preferences,
                "result_ids": [item["id"] for item in results],
                "created_at": datetime.now(timezone.utc),
            }
        )
    except Exception:
        pass
    return {"items": results, "count": len(results)}
