from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package, TourProductAddon
from ..schemas import TourProductAddonCreate

router = APIRouter(prefix="/tour-product-addons", tags=["Tour Product Addons"])


@router.get("/{package_id}")
def get_product_addons(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    return (
        db.query(TourProductAddon)
        .filter(TourProductAddon.package_id == package_id)
        .order_by(TourProductAddon.created_at.asc())
        .all()
    )


@router.post("/{package_id}")
def create_product_addon(
    package_id: int,
    payload: TourProductAddonCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = db.query(Package).filter(Package.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    addon = TourProductAddon(package_id=package_id, **payload.model_dump())
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


@router.delete("/{addon_id}")
def delete_product_addon(
    addon_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    addon = db.query(TourProductAddon).filter(TourProductAddon.id == addon_id).first()
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")

    db.delete(addon)
    db.commit()
    return {"success": True}