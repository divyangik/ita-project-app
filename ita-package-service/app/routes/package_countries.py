from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package, PackageCountry
from ..schemas import PackageCountryCreate, PackageCountryResponse
from ..dependencies import check_internal_key
router = APIRouter(prefix="/packages/{package_id}/countries", tags=["package-countries"])


def _get_package_or_404(db: Session, package_id: int, shop: str) -> Package:
    pkg = (
        db.query(Package)
        .filter(Package.id == package_id, Package.shop_domain == shop)
        .first()
    )
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


@router.get("", response_model=list[PackageCountryResponse])
def list_countries(
    package_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    return (
        db.query(PackageCountry)
        .filter(PackageCountry.package_id == package_id)
        .order_by(PackageCountry.display_order)
        .all()
    )


@router.post("", response_model=PackageCountryResponse)
def add_country(
    package_id: int,
    shop: str,
    payload: PackageCountryCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    row = PackageCountry(package_id=package_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{country_id}")
def delete_country(
    package_id: int,
    country_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    _get_package_or_404(db, package_id, shop)
    row = (
        db.query(PackageCountry)
        .filter(PackageCountry.id == country_id, PackageCountry.package_id == package_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Country not found")
    db.delete(row)
    db.commit()
    return {"ok": True}