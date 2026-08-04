import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
 
from ..database import get_db
from ..models import (
    Package, TourInfo, TourDate, TourCapacity,
    TourPricing, TourPaymentOption, TourIncludes, TourGuestAddon,
    Enquiry,
)
from ..schemas import EnquiryCreate
 
router = APIRouter(prefix="/store", tags=["Storefront"])
 
EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+\@[\w\-]+\.[a-zA-Z]{2,}$")
 
 
def _model_to_dict(instance):
    if instance is None:
        return {}
    return {c.name: getattr(instance, c.name) for c in instance.__table__.columns}
 
 
def _find_package(db: Session, shopify_product_id: str):
    return (
        db.query(Package)
        .filter(
            (Package.shopify_product_id == shopify_product_id)
            | (Package.shopify_product_id == f"gid://shopify/Product/{shopify_product_id}")
        )
        .filter(Package.status == "Published")
        .first()
    )
 
 
@router.get("/package/{shopify_product_id}")
def get_storefront_package(shopify_product_id: str, db: Session = Depends(get_db)):
    package = _find_package(db, shopify_product_id)
 
    if not package:
        return {"view": None}
 
    tour_info = db.query(TourInfo).filter(TourInfo.package_id == package.id).first()
    tour_dates = (
        db.query(TourDate)
        .filter(TourDate.package_id == package.id, TourDate.status != "Cancelled")
        .order_by(TourDate.departure_date.asc())
        .all()
    )
    tour_capacity = db.query(TourCapacity).filter(TourCapacity.package_id == package.id).first()
    tour_pricing = db.query(TourPricing).filter(TourPricing.package_id == package.id).first()
    tour_payment = db.query(TourPaymentOption).filter(TourPaymentOption.package_id == package.id).first()
    tour_includes = db.query(TourIncludes).filter(TourIncludes.package_id == package.id).first()
    guest_addons = (
        db.query(TourGuestAddon)
        .filter(TourGuestAddon.package_id == package.id, TourGuestAddon.visible == True)
        .order_by(TourGuestAddon.display_order.asc())
        .all()
    )
 
    includes_dict = _model_to_dict(tour_includes)
    if includes_dict.get("included"):
        try:
            includes_dict["included"] = json.loads(includes_dict["included"])
        except (TypeError, json.JSONDecodeError):
            includes_dict["included"] = []
    else:
        includes_dict["included"] = []
 
    return {
        "view": True,
        "package": _model_to_dict(package),
        "tour_info": _model_to_dict(tour_info),
        "capacity": _model_to_dict(tour_capacity),
        "pricing": _model_to_dict(tour_pricing),
        "payment": _model_to_dict(tour_payment),
        "includes": includes_dict,
        "dates": [
            {
                "id": d.id,
                "departure_date": str(d.departure_date),
                "return_date": str(d.return_date),
                "adult_price": float(d.adult_price),
                "child_price": float(d.child_price) if d.child_price else None,
                "seats_total": d.seats_total,
                "seats_available": d.seats_available,
                "is_default": d.is_default,
                "status": d.status,
            }
            for d in tour_dates
        ],
        "addons": [
            {
                "id": a.id,
                "addon_name": a.addon_name,
                "description": a.description,
                "price": float(a.price),
                "visible": a.visible,
                "display_order": a.display_order,
            }
            for a in guest_addons
        ],
    }
 
 
@router.post("/enquiry/{shopify_product_id}")
def create_enquiry(shopify_product_id: str, data: EnquiryCreate, db: Session = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=422, detail="Name is required")
    if not EMAIL_REGEX.match(data.email):
        raise HTTPException(status_code=422, detail="Valid email is required")
    if not data.phone.strip():
        raise HTTPException(status_code=422, detail="Phone is required")

    package = _find_package(db, shopify_product_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    enquiry = Enquiry(
        shop_domain=package.shop_domain,
        package_title=package.title,
        name=data.name.strip(),
        email=data.email.strip(),
        phone=data.phone.strip(),
        message=data.message,
    )
    db.add(enquiry)
    db.commit()

    return {"success": True, "id": enquiry.id}