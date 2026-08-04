from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package, TourPricing
from ..schemas import TourPricingCreate

router = APIRouter(
    prefix="/tour-pricing",
    tags=["Tour Pricing"],
)


@router.get("/{package_id}")
def get_tour_pricing(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    pricing = (
        db.query(TourPricing)
        .filter(TourPricing.package_id == package_id)
        .first()
    )

    if not pricing:
        raise HTTPException(
            status_code=404,
            detail="Pricing not found",
        )

    return pricing


@router.put("/{package_id}")
def save_tour_pricing(
    package_id: int,
    payload: TourPricingCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = (
        db.query(Package)
        .filter(Package.id == package_id)
        .first()
    )

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found",
        )

    pricing = (
        db.query(TourPricing)
        .filter(TourPricing.package_id == package_id)
        .first()
    )

    data = payload.model_dump()

    if pricing is None:
        pricing = TourPricing(
            package_id=package_id,
            **data,
        )
        db.add(pricing)
    else:
        for key, value in data.items():
            setattr(pricing, key, value)

    db.commit()
    db.refresh(pricing)

    return pricing