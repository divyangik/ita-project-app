from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import IncludeOption
from ..schemas import (
    IncludeOptionCreate,
    IncludeOptionUpdate,
    IncludeOptionResponse,
)

router = APIRouter(
    prefix="/include-options",
    tags=["Include Options"],
)


@router.get("", response_model=list[IncludeOptionResponse])
def list_include_options(
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    return (
        db.query(IncludeOption)
        .filter(IncludeOption.shop_domain == shop)
        .order_by(IncludeOption.display_order.asc(), IncludeOption.id.asc())
        .all()
    )


@router.post("", response_model=IncludeOptionResponse)
def create_include_option(
    data: IncludeOptionCreate,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    next_order = (
        db.query(IncludeOption).filter(IncludeOption.shop_domain == shop).count()
    )

    option = IncludeOption(
        shop_domain=shop,
        name=data.name,
        svg=data.svg,
        display_order=data.display_order or next_order,
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.patch("/{option_id}", response_model=IncludeOptionResponse)
def update_include_option(
    option_id: int,
    data: IncludeOptionUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = db.query(IncludeOption).filter(IncludeOption.id == option_id).first()

    if not option:
        raise HTTPException(status_code=404, detail="Include option not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(option, key, value)

    db.commit()
    db.refresh(option)

    return option


@router.delete("/{option_id}")
def delete_include_option(
    option_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = db.query(IncludeOption).filter(IncludeOption.id == option_id).first()

    if not option:
        raise HTTPException(status_code=404, detail="Include option not found")

    db.delete(option)
    db.commit()

    return {"message": "Include option deleted"}