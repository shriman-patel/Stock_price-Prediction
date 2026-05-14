from fastapi import APIRouter
from passlib.hash import bcrypt

router = APIRouter()

@router.post("/register")
def register(user: dict):

    hashed = bcrypt.hash(user["password"])

    return {
        "message": "User Registered",
        "hashed_password": hashed
    }