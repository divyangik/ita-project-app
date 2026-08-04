from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package, TourCapacity
from ..schemas import TourCapacityCreate
from ..dependencies import check_internal_key

router = APIRouter(
    prefix="/tour-capacity",
    tags=["Tour Capacity"],
)


@router.get("/{package_id}")
def get_tour_capacity(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    capacity = (
        db.query(TourCapacity)
        .filter(TourCapacity.package_id == package_id)
        .first()
    )

    if not capacity:
        raise HTTPException(
            status_code=404,
            detail="Capacity information not found",
        )

    return capacity


@router.put("/{package_id}")
def save_tour_capacity(
    package_id: int,
    payload: TourCapacityCreate,
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

    capacity = (
        db.query(TourCapacity)
        .filter(TourCapacity.package_id == package_id)
        .first()
    )

    data = payload.model_dump()

    if capacity is None:
        capacity = TourCapacity(
            package_id=package_id,
            **data,
        )
        db.add(capacity)
    else:
        for key, value in data.items():
            setattr(capacity, key, value)

    db.commit()
    db.refresh(capacity)

    return capacity