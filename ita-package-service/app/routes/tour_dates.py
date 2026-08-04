from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import TourDate
from ..schemas import TourDateCreate, TourDateResponse

router = APIRouter(
    prefix="/tour-dates",
    tags=["Tour Dates"],
)


@router.get("", response_model=list[TourDateResponse])
def list_tour_dates(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    return (
        db.query(TourDate)
        .filter(TourDate.package_id == package_id)
        .order_by(TourDate.departure_date.asc())
        .all()
    )


@router.post("", response_model=TourDateResponse)
def create_tour_date(
    data: TourDateCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    is_first = (
        db.query(TourDate)
        .filter(TourDate.package_id == data.package_id)
        .count()
        == 0
    )

    tour_date = TourDate(
        package_id=data.package_id,
        departure_date=data.departure_date,
        return_date=data.return_date,
        seats_total=data.seats_total,
        seats_available=data.seats_available,
        adult_price=data.adult_price,
        child_price=data.child_price,
        single_supplement=data.single_supplement,
        is_default=is_first,
        status=data.status,
        notes=data.notes,
    )

    db.add(tour_date)
    db.commit()
    db.refresh(tour_date)

    return tour_date


@router.patch("/{date_id}/set-default", response_model=TourDateResponse)
def set_default_date(
    date_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    tour_date = db.query(TourDate).filter(TourDate.id == date_id).first()

    if not tour_date:
        raise HTTPException(status_code=404, detail="Tour date not found")

    db.query(TourDate).filter(
        TourDate.package_id == tour_date.package_id
    ).update({TourDate.is_default: False})

    tour_date.is_default = True
    db.commit()
    db.refresh(tour_date)

    return tour_date


@router.delete("/{date_id}")
def delete_tour_date(
    date_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    tour_date = db.query(TourDate).filter(TourDate.id == date_id).first()

    if not tour_date:
        raise HTTPException(status_code=404, detail="Tour date not found")

    db.delete(tour_date)
    db.commit()

    return {"message": "Tour date deleted"}