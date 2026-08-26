import json
import os
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
 
from ..database import get_db
from ..models import (
    Package, TourInfo, TourDate, TourCapacity,
    TourPricing, TourPaymentOption, TourIncludes, TourGuestAddon,
    TourCTAButtons, TourHeroImages, TourItinerary, TourProductAddon,
    PackageCountry, PackageCity, PackageIncludeSelection, IncludeOption,
    Enquiry, GuestCategoryOption,
)
from ..schemas import EnquiryCreate, EmailItineraryCreate
from ..emailer import send_itinerary_email
 
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
 
    tour_info = (
    db.query(TourInfo)
    .filter(TourInfo.package_id == package.id)
    .order_by(TourInfo.id.desc())
    .first()
    )
    
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

    # Previously missing from the storefront response — now included so
    # every field visible in the dashboard is also available here.
    tour_cta = db.query(TourCTAButtons).filter(TourCTAButtons.package_id == package.id).first()
    tour_hero = db.query(TourHeroImages).filter(TourHeroImages.package_id == package.id).first()
    tour_itinerary = db.query(TourItinerary).filter(TourItinerary.package_id == package.id).first()

    product_addons = (
        db.query(TourProductAddon)
        .filter(TourProductAddon.package_id == package.id)
        .all()
    )
    countries = (
        db.query(PackageCountry)
        .filter(PackageCountry.package_id == package.id)
        .order_by(PackageCountry.display_order.asc())
        .all()
    )
    cities = (
        db.query(PackageCity)
        .filter(PackageCity.package_id == package.id)
        .order_by(PackageCity.display_order.asc())
        .all()
    )

    # "Package includes" library items (name + icon svg) selected for this
    # package — join the selection table to the shop-level option library.
    selected_includes = (
        db.query(IncludeOption)
        .join(
            PackageIncludeSelection,
            PackageIncludeSelection.include_option_id == IncludeOption.id,
        )
        .filter(PackageIncludeSelection.package_id == package.id)
        .order_by(IncludeOption.display_order.asc())
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

    # Build value -> {name, message} lookups for the Package Type /
    # Traveller options actually selected on this tour, scoped to the
    # shop's option library. The widget uses `message` (when set by the
    # merchant in the dashboard) instead of its built-in static note text.
    def _guest_type_details(kind: str, selected_csv: str | None):
        selected_values = (
            [v.strip() for v in selected_csv.split(",") if v.strip()]
            if selected_csv
            else []
        )
        if not selected_values:
            return []

        options = (
            db.query(GuestCategoryOption)
            .filter(
                GuestCategoryOption.shop_domain == package.shop_domain,
                GuestCategoryOption.kind == kind,
                GuestCategoryOption.value.in_(selected_values),
            )
            .all()
        )
        by_value = {o.value: o for o in options}

        return [
            {
                "value": value,
                "name": by_value[value].name if value in by_value else value,
                "message": by_value[value].message if value in by_value else None,
            }
            for value in selected_values
        ]

    guest_type_details = {
        "package_type": _guest_type_details(
            "package_type", tour_info.package_type_tags if tour_info else None
        ),
        "traveller_type": _guest_type_details(
            "traveller", tour_info.traveller_types if tour_info else None
        ),
    }

    return {
        "view": True,
        "package": _model_to_dict(package),
        "tour_info": _model_to_dict(tour_info),
        "guest_type_details": guest_type_details,
        "capacity": _model_to_dict(tour_capacity),
        "pricing": _model_to_dict(tour_pricing),
        "payment": _model_to_dict(tour_payment),
        "includes": includes_dict,
        "cta_buttons": _model_to_dict(tour_cta),
        "hero_images": _model_to_dict(tour_hero),
        "itinerary": _model_to_dict(tour_itinerary),
        "countries": [
            {"id": c.id, "name": c.name, "display_order": c.display_order}
            for c in countries
        ],
        "cities": [
            {"id": c.id, "name": c.name, "display_order": c.display_order}
            for c in cities
        ],
        "included_items": [
            {
                "id": opt.id,
                "name": opt.name,
                "svg": opt.svg,
                "display_order": opt.display_order,
            }
            for opt in selected_includes
        ],
        "dates": [
            {
                "id": d.id,
                "departure_date": str(d.departure_date),
                "return_date": str(d.return_date),
                "adult_price": float(d.adult_price),
                "child_price": float(d.child_price) if d.child_price else None,
                "single_supplement": float(d.single_supplement) if d.single_supplement else None,
                "seats_total": d.seats_total,
                "seats_available": d.seats_available,
                "is_default": d.is_default,
                "status": d.status,
                "notes": d.notes,
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
        "product_addons": [
            {
                "id": p.id,
                "shopify_product_id": p.shopify_product_id,
                "shopify_variant_id": p.shopify_variant_id,
                "product_title": p.product_title,
                "price": float(p.price) if p.price is not None else None,
                "image_url": p.image_url,
            }
            for p in product_addons
        ],
    }
 
# @router.get("/package/{shopify_product_id}")
# def get_storefront_package(shopify_product_id: str, db: Session = Depends(get_db)):
#     try:
#         package = _find_package(db, shopify_product_id)

#         if not package:
#             return {"view": None}

#         tour_info = db.query(TourInfo).filter(TourInfo.package_id == package.id).first()
#         tour_dates = (
#             db.query(TourDate)
#             .filter(TourDate.package_id == package.id, TourDate.status != "Cancelled")
#             .order_by(TourDate.departure_date.asc())
#             .all()
#         )
#         tour_capacity = db.query(TourCapacity).filter(TourCapacity.package_id == package.id).first()
#         tour_pricing = db.query(TourPricing).filter(TourPricing.package_id == package.id).first()
#         tour_payment = db.query(TourPaymentOption).filter(TourPaymentOption.package_id == package.id).first()
#         tour_includes = db.query(TourIncludes).filter(TourIncludes.package_id == package.id).first()
#         guest_addons = (
#             db.query(TourGuestAddon)
#             .filter(TourGuestAddon.package_id == package.id, TourGuestAddon.visible == True)
#             .order_by(TourGuestAddon.display_order.asc())
#             .all()
#         )

#         includes_dict = _model_to_dict(tour_includes)
#         if includes_dict.get("included"):
#             try:
#                 includes_dict["included"] = json.loads(includes_dict["included"])
#             except (TypeError, json.JSONDecodeError):
#                 includes_dict["included"] = []
#         else:
#             includes_dict["included"] = []

#         return {
#             "view": True,
#             "package": _model_to_dict(package),
#             "tour_info": _model_to_dict(tour_info),
#             "capacity": _model_to_dict(tour_capacity),
#             "pricing": _model_to_dict(tour_pricing),
#             "payment": _model_to_dict(tour_payment),
#             "includes": includes_dict,
#             "dates": [
#                 {
#                     "id": d.id,
#                     "departure_date": str(d.departure_date),
#                     "return_date": str(d.return_date),
#                     "adult_price": float(d.adult_price),
#                     "child_price": float(d.child_price) if d.child_price else None,
#                     "seats_total": d.seats_total,
#                     "seats_available": d.seats_available,
#                     "is_default": d.is_default,
#                     "status": d.status,
#                 }
#                 for d in tour_dates
#             ],
#             "addons": [
#                 {
#                     "id": a.id,
#                     "addon_name": a.addon_name,
#                     "description": a.description,
#                     "price": float(a.price),
#                     "visible": a.visible,
#                     "display_order": a.display_order,
#                 }
#                 for a in guest_addons
#             ],
#         }
#     except Exception:
#         import traceback
#         traceback.print_exc()  # still shows up in your terminal so you can see what broke
#         return {"view": None}

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

@router.post("/email-itinerary/{shopify_product_id}")
def email_itinerary(shopify_product_id: str, data: EmailItineraryCreate, db: Session = Depends(get_db)):
    if not EMAIL_REGEX.match(data.email):
        raise HTTPException(status_code=422, detail="Valid email is required")

    package = _find_package(db, shopify_product_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    itinerary = db.query(TourItinerary).filter(TourItinerary.package_id == package.id).first()

    pdf_path = None
    if itinerary and itinerary.itinerary_pdf_url:
        filename = itinerary.itinerary_pdf_url.rstrip("/").split("/")[-1]
        pdf_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "uploads", "itinerary_pdfs", filename
        )

    sent = send_itinerary_email(
        to_email=data.email.strip(),
        name=(data.name or "").strip(),
        package_title=package.title,
        pdf_path=pdf_path,
    )
    if not sent:
        raise HTTPException(status_code=500, detail="Could not send email. Please try again.")

    return {"success": True}