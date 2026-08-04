from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Package
from ..dependencies import check_internal_key

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def _normalize_status(raw):
    value = (raw or "").lower()

    if "publish" in value or "live" in value:
        return "live"

    if "archiv" in value:
        return "archived"

    return "draft"


@router.get("")
def dashboard(
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    packages = db.query(Package).filter_by(shop_domain=shop).all()

    total = len(packages)

    draft = len(
        [p for p in packages if _normalize_status(p.status) == "draft"]
    )

    active = len(
        [p for p in packages if _normalize_status(p.status) == "live"]
    )

    revenue = sum(float(p.base_price) for p in packages)

    return {
        "shop": shop,
        "totalPackages": total,
        "draftPackages": draft,
        "activePackages": active,
        "totalRevenue": revenue,
        "recentPackages": [
            {
                "id": p.id,
                "title": p.title,
                "destination": p.destination,
                "region": p.region,
                "price": float(p.base_price),
                "payment_status": p.payment_status,
                "status": p.status,
            }
            for p in packages[-5:]
        ],
    }