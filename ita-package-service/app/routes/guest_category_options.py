from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import GuestCategoryOption, Package, TourInfo
from ..schemas import (
    GuestCategoryOptionCreate,
    GuestCategoryOptionUpdate,
    GuestCategoryOptionResponse,
)

router = APIRouter(
    prefix="/guest-category-options",
    tags=["Guest Category Options"],
)

# Maps a GuestCategoryOption.kind to the comma-separated TourInfo column
# that stores selected *values* of that kind. Selections are stored as raw
# value strings (no FK), so renaming/deleting an option must be cascaded
# into every TourInfo row that has the old value selected, or the
# selection becomes orphaned (see bug: tag rename looked like "adding a
# new tag" because the old value string was left behind).
KIND_TO_TOUR_INFO_COLUMN = {
    "tour_type": "tour_type_tags",
    "package_type": "package_type_tags",
    "traveller": "traveller_types",
}


def _cascade_value_change(db: Session, option: GuestCategoryOption, old_value: str, new_value: str | None) -> None:
    """Update every TourInfo row (scoped to this option's shop) that has
    `old_value` selected for this option's kind. Pass new_value=None to
    remove the selection entirely (used on delete)."""
    if old_value == new_value:
        return

    column_name = KIND_TO_TOUR_INFO_COLUMN.get(option.kind)
    if not column_name:
        return

    column = getattr(TourInfo, column_name)

    rows = (
        db.query(TourInfo)
        .join(Package, Package.id == TourInfo.package_id)
        .filter(
            Package.shop_domain == option.shop_domain,
            column.isnot(None),
        )
        .all()
    )

    for row in rows:
        raw = getattr(row, column_name) or ""
        values = [v.strip() for v in raw.split(",") if v.strip()]

        if old_value not in values:
            continue

        if new_value is None:
            values = [v for v in values if v != old_value]
        else:
            values = [new_value if v == old_value else v for v in values]
            # Deduplicate in case the new value was already separately selected
            seen = set()
            deduped = []
            for v in values:
                if v not in seen:
                    seen.add(v)
                    deduped.append(v)
            values = deduped

        setattr(row, column_name, ",".join(values))


@router.get("", response_model=list[GuestCategoryOptionResponse])
def list_guest_category_options(
    shop: str,
    kind: str | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    query = db.query(GuestCategoryOption).filter(
        GuestCategoryOption.shop_domain == shop
    )
    if kind:
        query = query.filter(GuestCategoryOption.kind == kind)

    return query.order_by(
        GuestCategoryOption.display_order.asc(), GuestCategoryOption.id.asc()
    ).all()


@router.post("", response_model=GuestCategoryOptionResponse)
def create_guest_category_option(
    data: GuestCategoryOptionCreate,
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    next_order = (
        db.query(GuestCategoryOption)
        .filter(
            GuestCategoryOption.shop_domain == shop,
            GuestCategoryOption.kind == data.kind,
        )
        .count()
    )

    option = GuestCategoryOption(
        shop_domain=shop,
        kind=data.kind,
        name=data.name,
        value=data.value,
        display_order=data.display_order or next_order,
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.patch("/{option_id}", response_model=GuestCategoryOptionResponse)
def update_guest_category_option(
    option_id: int,
    data: GuestCategoryOptionUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = (
        db.query(GuestCategoryOption)
        .filter(GuestCategoryOption.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(status_code=404, detail="Guest category option not found")

    old_value = option.value

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(option, key, value)

    if "value" in data.model_dump(exclude_unset=True) and option.value != old_value:
        _cascade_value_change(db, option, old_value, option.value)

    db.commit()
    db.refresh(option)

    return option


@router.delete("/{option_id}")
def delete_guest_category_option(
    option_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    option = (
        db.query(GuestCategoryOption)
        .filter(GuestCategoryOption.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(status_code=404, detail="Guest category option not found")

    _cascade_value_change(db, option, option.value, None)

    db.delete(option)
    db.commit()

    return {"message": "Guest category option deleted"}