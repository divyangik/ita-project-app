from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import check_internal_key
from ..models import PackageIncludeSelection
from ..schemas import PackageIncludeSelectionUpdate

router = APIRouter(
    prefix="/package-include-selections",
    tags=["Package Include Selections"],
)


@router.get("/{package_id}")
def get_selections(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    rows = (
        db.query(PackageIncludeSelection)
        .filter(PackageIncludeSelection.package_id == package_id)
        .all()
    )

    return {
        "package_id": package_id,
        "option_ids": [row.include_option_id for row in rows],
    }


@router.put("/{package_id}")
def save_selections(
    package_id: int,
    data: PackageIncludeSelectionUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    db.query(PackageIncludeSelection).filter(
        PackageIncludeSelection.package_id == package_id
    ).delete()

    for option_id in data.option_ids:
        db.add(
            PackageIncludeSelection(
                package_id=package_id,
                include_option_id=option_id,
            )
        )

    db.commit()

    return {"package_id": package_id, "option_ids": data.option_ids}