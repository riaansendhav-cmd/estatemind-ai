from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import create_token, current_user, hash_password, verify_password
from app.core.database import get_database
from typing import Annotated
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    name: str = Field(default="", max_length=80)
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str


def public_user(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@router.post("/register")
async def register(payload: AuthRequest):
    db = get_database()
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = {
        "id": str(uuid4()),
        "name": payload.name.strip() or email.split("@")[0],
        "email": email,
        "password_hash": hash_password(payload.password),
    }
    await db.users.insert_one(user)
    return {"user": public_user(user), "token": create_token(user)}


@router.post("/login")
async def login(payload: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return {"user": public_user(user), "token": create_token(user)}


@router.get("/me")
async def me(user: Annotated[dict, Depends(current_user)]):
    return {"user": public_user(user)}
