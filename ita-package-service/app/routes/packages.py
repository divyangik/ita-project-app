from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import time
from ..schemas import PackageUpdate
from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package
from ..schemas import PackageCreate, PackageResponse
from sqlalchemy.orm import Session, joinedload

router = APIRouter(
    prefix="/packages",
    tags=["Packages"],
)


from sqlalchemy.orm import Session, joinedload
...

@router.get("/{package_id}", response_model=PackageResponse)
def get_package(
    package_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = (
        db.query(Package)
        .options(joinedload(Package.tour_dates))
        .filter(Package.id == package_id, Package.shop_domain == shop)
        .first()
    )
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.get("", response_model=list[PackageResponse])
def list_packages(
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    packages = (
        db.query(Package)
        .options(joinedload(Package.tour_dates))
        .filter(Package.shop_domain == shop)
        .order_by(Package.created_at.desc(), Package.id.desc())
        .all()
    )
    return packages

@router.post("")
def create_package(
    data: PackageCreate,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = Package(
        package_code=f"PKG-{int(time.time())}",
        shop_domain=shop,
        title=data.title,
        destination=data.destination,
        region=data.region,
        base_price=data.base_price,
        duration=data.duration,
        status=data.status,
        shopify_product_id=data.shopify_product_id,
        shopify_variant_id=data.shopify_variant_id,
        shopify_collection_id=data.shopify_collection_id,
    )

    db.add(package)
    db.commit()
    db.refresh(package)

    return {
        "message": "Package created successfully",
        "package": PackageResponse.model_validate(package),
    }

@router.patch("/{package_id}", response_model=PackageResponse)
def update_package(
    package_id: int,
    data: PackageUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = db.query(Package).filter(Package.id == package_id).first()

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(package, key, value)

    db.commit()
    db.refresh(package)

    return package
@router.delete("/{package_id}")
def delete_package(
    package_id: int,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = (
        db.query(Package)
        .filter(
            Package.id == package_id,
            Package.shop_domain == shop,
        )
        .first()
    )

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    try:
        db.delete(package)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    return {"message": "Package deleted"}