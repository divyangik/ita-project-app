from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package, TourIncludes, TourCTAButtons, TourHeroImages
from ..schemas import TourIncludesCreate
from ..dependencies import check_internal_key

router = APIRouter(
    prefix="/tour-includes",
    tags=["Tour Includes"],
)

INCLUDE_TOGGLE_FIELDS = [
    "hotels",
    "transport",
    "sightseeing",
    "activities",
    "food",
    "beverage",
    "flights",
    "insurance",
    "water_sports",
    "cycling",
    "spa",
    "wifi",
]

CTA_FIELDS = [
    "primary_label",
    "primary_url",
    "secondary_label",
    "enquiry_email_or_url",
]

HERO_FIELDS = [
    "hero_image",
    "image_alt_text",
    "show_selection_summary",
]


def _merge_includes(includes, cta, hero) -> dict:
    """Flatten the 3 table rows into the single shape the frontend expects."""
    data = {}

    for field in INCLUDE_TOGGLE_FIELDS:
        data[field] = getattr(includes, field, False) if includes else False

    for field in CTA_FIELDS:
        data[field] = getattr(cta, field, None) if cta else None

    for field in HERO_FIELDS:
        default = False if field == "show_selection_summary" else None
        data[field] = getattr(hero, field, default) if hero else default

    return data


@router.get("/{package_id}")
def get_tour_includes(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    includes = (
        db.query(TourIncludes)
        .filter(TourIncludes.package_id == package_id)
        .first()
    )
    cta = (
        db.query(TourCTAButtons)
        .filter(TourCTAButtons.package_id == package_id)
        .first()
    )
    hero = (
        db.query(TourHeroImages)
        .filter(TourHeroImages.package_id == package_id)
        .first()
    )

    if not includes and not cta and not hero:
        raise HTTPException(
            status_code=404,
            detail="Tour includes not found",
        )

    merged = _merge_includes(includes, cta, hero)
    merged["id"] = includes.id if includes else 0
    merged["package_id"] = package_id

    return merged


@router.put("/{package_id}")
def save_tour_includes(
    package_id: int,
    payload: TourIncludesCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = db.query(Package).filter(Package.id == package_id).first()

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found",
        )

    data = payload.model_dump()

    # --- tour_includes (checkbox toggles) ---
    includes = (
        db.query(TourIncludes)
        .filter(TourIncludes.package_id == package_id)
        .first()
    )
    toggle_data = {k: data[k] for k in INCLUDE_TOGGLE_FIELDS}
    if includes is None:
        includes = TourIncludes(package_id=package_id, **toggle_data)
        db.add(includes)
    else:
        for key, value in toggle_data.items():
            setattr(includes, key, value)

    # --- tour_cta_buttons ---
    cta = (
        db.query(TourCTAButtons)
        .filter(TourCTAButtons.package_id == package_id)
        .first()
    )
    cta_data = {k: data[k] for k in CTA_FIELDS}
    if cta is None:
        cta = TourCTAButtons(package_id=package_id, **cta_data)
        db.add(cta)
    else:
        for key, value in cta_data.items():
            setattr(cta, key, value)

    # --- tour_hero_images ---
    hero = (
        db.query(TourHeroImages)
        .filter(TourHeroImages.package_id == package_id)
        .first()
    )
    hero_data = {k: data[k] for k in HERO_FIELDS}
    if hero is None:
        hero = TourHeroImages(package_id=package_id, **hero_data)
        db.add(hero)
    else:
        for key, value in hero_data.items():
            setattr(hero, key, value)

    db.commit()

    db.refresh(includes)
    db.refresh(cta)
    db.refresh(hero)

    merged = _merge_includes(includes, cta, hero)
    merged["id"] = includes.id
    merged["package_id"] = package_id

    return merged