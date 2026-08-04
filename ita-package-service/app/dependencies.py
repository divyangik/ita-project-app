from fastapi import Header, HTTPException

from .config import INTERNAL_KEY


def check_internal_key(x_internal_key: str = Header(None)):
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )