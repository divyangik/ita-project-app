from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package, TourGuestAddon
from ..schemas import TourGuestAddonCreate
from ..crud import sync_package_addons

router = APIRouter(
    prefix="/tour-addons",
    tags=["Tour Guest Addons"],
)


@router.get("/{package_id}")
def get_addons(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    return (
        db.query(TourGuestAddon)
        .filter(TourGuestAddon.package_id == package_id)
        .order_by(TourGuestAddon.display_order)
        .all()
    )


@router.post("/{package_id}")
def create_addon(
    package_id: int,
    payload: TourGuestAddonCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = db.query(Package).filter(Package.id == package_id).first()

    if not package:
        raise HTTPException(404, "Package not found")

    addon = TourGuestAddon(
        package_id=package_id,
        **payload.model_dump(),
    )

    db.add(addon)
    db.commit()
    db.refresh(addon)

    sync_package_addons(db, package_id)

    return addon


@router.put("/{addon_id}")
def update_addon(
    addon_id: int,
    payload: TourGuestAddonCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    addon = (
        db.query(TourGuestAddon)
        .filter(TourGuestAddon.id == addon_id)
        .first()
    )

    if not addon:
        raise HTTPException(404, "Addon not found")

    for key, value in payload.model_dump().items():
        setattr(addon, key, value)

    db.commit()
    db.refresh(addon)

    sync_package_addons(db, addon.package_id)

    return addon


@router.delete("/{addon_id}")
def delete_addon(
    addon_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    addon = (
        db.query(TourGuestAddon)
        .filter(TourGuestAddon.id == addon_id)
        .first()
    )

    if not addon:
        raise HTTPException(404, "Addon not found")

    package_id = addon.package_id

    db.delete(addon)
    db.commit()

    sync_package_addons(db, package_id)

    return {"message": "Addon deleted"}