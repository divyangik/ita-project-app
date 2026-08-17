from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import GuestCategoryOption
from ..schemas import (
    GuestCategoryOptionCreate,
    GuestCategoryOptionUpdate,
    GuestCategoryOptionResponse,
)

router = APIRouter(
    prefix="/guest-category-options",
    tags=["Guest Category Options"],
)


@router.get("", response_model=list[GuestCategoryOptionResponse])
def list_guest_category_options(
    shop: str,
    kind: str | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    query = db.query(GuestCategoryOption).filter(
        GuestCategoryOption.shop_domain == shop
    )
    if kind:
        query = query.filter(GuestCategoryOption.kind == kind)

    return query.order_by(
        GuestCategoryOption.display_order.asc(), GuestCategoryOption.id.asc()
    ).all()


@router.post("", response_model=GuestCategoryOptionResponse)
def create_guest_category_option(
    data: GuestCategoryOptionCreate,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    next_order = (
        db.query(GuestCategoryOption)
        .filter(
            GuestCategoryOption.shop_domain == shop,
            GuestCategoryOption.kind == data.kind,
        )
        .count()
    )

    option = GuestCategoryOption(
        shop_domain=shop,
        kind=data.kind,
        name=data.name,
        value=data.value,
        display_order=data.display_order or next_order,
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.patch("/{option_id}", response_model=GuestCategoryOptionResponse)
def update_guest_category_option(
    option_id: int,
    data: GuestCategoryOptionUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = (
        db.query(GuestCategoryOption)
        .filter(GuestCategoryOption.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(status_code=404, detail="Guest category option not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(option, key, value)

    db.commit()
    db.refresh(option)

    return option


@router.delete("/{option_id}")
def delete_guest_category_option(
    option_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = (
        db.query(GuestCategoryOption)
        .filter(GuestCategoryOption.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(status_code=404, detail="Guest category option not found")

    db.delete(option)
    db.commit()

    return {"message": "Guest category option deleted"}