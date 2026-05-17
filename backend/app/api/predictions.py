from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.core.auth import current_user
from app.core.database import get_database
from app.ml.predictor import predictor

router = APIRouter(prefix="/predict", tags=["predictions"])


class PredictionRequest(BaseModel):
    location: str
    property_type: str = "Apartment"
    area: int = Field(ge=250, le=10000)
    bedrooms: int = Field(ge=1, le=10)
    bathrooms: int = Field(ge=1, le=10)
    furnishing: str
    parking: int = Field(ge=0, le=8)


@router.post("")
async def predict_price(payload: PredictionRequest, user: Annotated[dict, Depends(current_user)]):
    request = payload.model_dump()
    result = predictor.predict(request)
    db = get_database()
    try:
        await db.prediction_history.insert_one(
            {
                "input": request,
                "result": result,
                "user_id": user["id"],
                "created_at": datetime.now(timezone.utc),
            }
        )
    except Exception:
        result["offline"] = True
    return result
