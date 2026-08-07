from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package, PackageCity
from ..schemas import PackageCityCreate, PackageCityResponse
from ..dependencies import check_internal_key
router = APIRouter(prefix="/packages/{package_id}/cities", tags=["package-cities"])


def _get_package_or_404(db: Session, package_id: int, shop: str) -> Package:
    pkg = (
        db.query(Package)
        .filter(Package.id == package_id, Package.shop_domain == shop)
        .first()
    )
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


@router.get("", response_model=list[PackageCityResponse])
def list_cities(
    package_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    return (
        db.query(PackageCity)
        .filter(PackageCity.package_id == package_id)
        .order_by(PackageCity.display_order)
        .all()
    )


@router.post("", response_model=PackageCityResponse)
def add_city(
    package_id: int,
    shop: str,
    payload: PackageCityCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    row = PackageCity(package_id=package_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{city_id}")
def delete_city(
    package_id: int,
    city_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    row = (
        db.query(PackageCity)
        .filter(PackageCity.id == city_id, PackageCity.package_id == package_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="City not found")
    db.delete(row)
    db.commit()
    return {"ok": True}