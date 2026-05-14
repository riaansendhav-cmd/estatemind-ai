from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from app.core.database import get_database
from app.data.sample_properties import SAMPLE_PROPERTIES

router = APIRouter(prefix="/properties", tags=["properties"])


class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(default="", max_length=1000)
    seller_name: str = Field(default="", max_length=80)
    seller_phone: str = Field(default="", max_length=40)
    property_type: str = "Apartment"
    listing_status: str = "For Sale"
    image: str = ""
    price: int = Field(ge=100000)
    location: str = Field(min_length=2, max_length=80)
    area: int = Field(ge=100)
    bedrooms: int = Field(ge=1, le=20)
    bathrooms: int = Field(ge=1, le=20)
    furnishing: str
    parking: int = Field(ge=0, le=20)
    amenities: list[str] = Field(default_factory=list)


async def load_properties() -> list[dict]:
    db = get_database()
    try:
        docs = await db.properties.find({}, {"_id": 0}).to_list(length=200)
        return docs or SAMPLE_PROPERTIES
    except Exception:
        return SAMPLE_PROPERTIES


@router.get("")
async def list_properties(
    search: str = "",
    location: str = "",
    property_type: str = "",
    furnishing: str = "",
    bedrooms: int | None = Query(default=None, ge=1),
    max_price: int | None = Query(default=None, ge=1),
    sort: str = "recommended",
):
    properties = await load_properties()

    if search:
        needle = search.lower()
        properties = [
            item
            for item in properties
            if needle in item["title"].lower()
            or needle in item["location"].lower()
            or needle in item.get("seller_name", "").lower()
        ]
    if location:
        properties = [item for item in properties if item["location"].lower() == location.lower()]
    if property_type:
        properties = [item for item in properties if item.get("property_type", "").lower() == property_type.lower()]
    if furnishing:
        properties = [item for item in properties if item.get("furnishing", "").lower() == furnishing.lower()]
    if bedrooms:
        properties = [item for item in properties if item["bedrooms"] == bedrooms]
    if max_price:
        properties = [item for item in properties if item["price"] <= max_price]

    if sort == "price_asc":
        properties = sorted(properties, key=lambda item: item["price"])
    elif sort == "price_desc":
        properties = sorted(properties, key=lambda item: item["price"], reverse=True)
    elif sort == "area_desc":
        properties = sorted(properties, key=lambda item: item["area"], reverse=True)

    return {"items": properties, "count": len(properties)}


@router.post("")
async def create_property(payload: PropertyCreate):
    data = payload.model_dump()
    data["id"] = data["title"].lower().replace(" ", "-")[:42]
    data["saved"] = False
    if not data["image"]:
        data["image"] = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"

    db = get_database()
    try:
        existing_count = await db.properties.count_documents({"id": data["id"]})
        if existing_count:
            data["id"] = f"{data['id']}-{existing_count + 1}"
        await db.properties.insert_one(data)
        return {**data, "published": True}
    except Exception:
        return {**data, "published": False, "offline": True}


@router.post("/{property_id}/save")
async def toggle_saved(property_id: str):
    db = get_database()
    try:
        existing = await db.saved_properties.find_one({"property_id": property_id})
        if existing:
            await db.saved_properties.delete_one({"property_id": property_id})
            saved = False
        else:
            await db.saved_properties.insert_one({"property_id": property_id})
            saved = True

        await db.properties.update_one({"id": property_id}, {"$set": {"saved": saved}})
        return {"property_id": property_id, "saved": saved}
    except Exception:
        return {"property_id": property_id, "saved": True, "offline": True}
