from sqlalchemy.orm import Session

from .models import Package, TourInfo, TourCapacity, TourGuestAddon


# Field -> included in the "addons" summary when True. Keep this list in
# sync with the checkboxes in CapacityEligibility.jsx (ita-package-manager).
ELIGIBILITY_FIELDS = [
    "child_allowed",
    "infant_allowed",
    "wheelchair_accessible",
    "passport_required",
    "visa_required",
]


def sync_package_addons(db: Session, package_id: int) -> dict:
    """
    Rebuilds the combined `packages.addons` JSON summary for one package
    from the tables that are the actual source of truth:
      - tour_info.package_type_tags / traveller_types (comma-separated text)
      - tour_capacity (only the eligibility flags that are turned on)
      - tour_guest_addons (only the ones marked visible)

    This column is READ-ONLY / derived from those tables — never edit it
    directly, and never treat it as the place to add/delete/update those
    tables from. It exists so the storefront can fetch one field instead
    of three separate calls. Call this at the end of every save/delete on
    tour_info, tour_capacity, or tour_guest_addons.
    """
    package = db.query(Package).filter(Package.id == package_id).first()
    if not package:
        return {}

    info = (
        db.query(TourInfo).filter(TourInfo.package_id == package_id).first()
    )
    capacity = (
        db.query(TourCapacity)
        .filter(TourCapacity.package_id == package_id)
        .first()
    )
    addons = (
        db.query(TourGuestAddon)
        .filter(
            TourGuestAddon.package_id == package_id,
            TourGuestAddon.visible == True,  # noqa: E712
        )
        .order_by(TourGuestAddon.display_order)
        .all()
    )

    summary = {
        "package_type": (
            info.package_type_tags.split(",")
            if info and info.package_type_tags
            else []
        ),
        "traveller_type": (
            info.traveller_types.split(",")
            if info and info.traveller_types
            else []
        ),
        "eligibility": (
            [
                field
                for field in ELIGIBILITY_FIELDS
                if getattr(capacity, field, False)
            ]
            if capacity
            else []
        ),
        "guest_addons": [
            {"id": a.id, "name": a.addon_name, "price": float(a.price)}
            for a in addons
        ],
    }

    package.addons = summary
    db.commit()

    return summary