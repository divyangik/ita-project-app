
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package, TourPaymentOption
from ..schemas import TourPaymentCreate

router = APIRouter(
    prefix="/tour-payment",
    tags=["Tour Payment"],
)


@router.get("/{package_id}")
def get_tour_payment(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    payment = (
        db.query(TourPaymentOption)
        .filter(TourPaymentOption.package_id == package_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment settings not found",
        )

    return payment


@router.put("/{package_id}")
def save_tour_payment(
    package_id: int,
    payload: TourPaymentCreate,
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

    payment = (
        db.query(TourPaymentOption)
        .filter(TourPaymentOption.package_id == package_id)
        .first()
    )

    data = payload.model_dump()

    if payment is None:
        payment = TourPaymentOption(
            package_id=package_id,
            **data,
        )
        db.add(payment)
    else:
        for key, value in data.items():
            setattr(payment, key, value)

    db.commit()
    db.refresh(payment)

    return payment