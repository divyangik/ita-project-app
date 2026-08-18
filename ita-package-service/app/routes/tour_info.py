from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package, TourInfo
from ..schemas import TourInfoCreate
from ..dependencies import check_internal_key
from ..crud import sync_package_addons

router = APIRouter(
    prefix="/tour-info",
    tags=["Tour Info"],
)


@router.get("/{package_id}")
def get_tour_info(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    info = (
        db.query(TourInfo)
        .filter(TourInfo.package_id == package_id)
        .first()
    )

    if not info:
        raise HTTPException(
            status_code=404,
            detail="Tour info not found",
        )

    return {
        "id": info.id,
        "package_id": info.package_id,
        "tour_title": info.tour_title,
        "duration_label": info.duration_label,
        "departure_city": info.departure_city,
        "start_city": info.start_city,
        "end_city": info.end_city,
        "days": info.days,
        "nights": info.nights,
        "country": info.country,
        "region": info.region,
        "category": info.category,
        "short_description": info.short_description,
        "tour_type_tags": (
            info.tour_type_tags.split(",")
            if info.tour_type_tags
            else []
        ),
        "package_type_tags": (
            info.package_type_tags.split(",")
            if info.package_type_tags
            else []
        ),
        "traveller_types": (
            info.traveller_types.split(",")
            if info.traveller_types
            else []
        ),
        "featured": info.featured,
    }


@router.put("/{package_id}")
def save_tour_info(
    package_id: int,
    payload: TourInfoCreate,
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

    info = (
        db.query(TourInfo)
        .filter(TourInfo.package_id == package_id)
        .first()
    )

    data = payload.model_dump()

    # Store tags as comma-separated string
    data["tour_type_tags"] = ",".join(data["tour_type_tags"])
    data["package_type_tags"] = ",".join(data["package_type_tags"])
    data["traveller_types"] = ",".join(data["traveller_types"])

    if info is None:
        info = TourInfo(
            package_id=package_id,
            **data,
        )
        db.add(info)
    else:
        for key, value in data.items():
            setattr(info, key, value)

    db.commit()
    db.refresh(info)

    sync_package_addons(db, package_id)

    return {
        "message": "Tour information saved successfully",
        "tour_info": {
            "id": info.id,
            "package_id": info.package_id,
            "tour_title": info.tour_title,
            "duration_label": info.duration_label,
            "departure_city": info.departure_city,
            "start_city": info.start_city,
            "end_city": info.end_city,
            "days": info.days,
            "nights": info.nights,
            "country": info.country,
            "region": info.region,
            "category": info.category,
            "short_description": info.short_description,
            "tour_type_tags": (
                info.tour_type_tags.split(",")
                if info.tour_type_tags
                else []
            ),
            "package_type_tags": (
                info.package_type_tags.split(",")
                if info.package_type_tags
                else []
            ),
            "traveller_types": (
                info.traveller_types.split(",")
                if info.traveller_types
                else []
            ),
            "featured": info.featured,
        },
    }