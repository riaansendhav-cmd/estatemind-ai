import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.data.sample_properties import SAMPLE_PROPERTIES


async def seed():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    await db.properties.delete_many({})
    await db.properties.insert_many(SAMPLE_PROPERTIES)
    print(f"Seeded {len(SAMPLE_PROPERTIES)} properties into {settings.mongodb_db}.properties")


if __name__ == "__main__":
    asyncio.run(seed())
