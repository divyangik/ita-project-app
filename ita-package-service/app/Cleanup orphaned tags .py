"""
One-off cleanup for orphaned comma-separated tag values in TourInfo.

Background
----------
Before the cascade fix in guest_category_options.py, renaming or deleting a
GuestCategoryOption did NOT update the TourInfo rows that had the old value
selected (tour_type_tags / package_type_tags / traveller_types are stored as
raw comma-separated value strings, not FKs). Any edits made before that fix
shipped can still have stale values sitting in these columns.

This script finds and strips those stale values. It's safe to re-run.

Usage
-----
    # Preview only, no DB writes, prints every row that would change:
    python cleanup_orphaned_tags.py --dry-run

    # Preview for a single shop only:
    python cleanup_orphaned_tags.py --dry-run --shop my-shop.myshopify.com

    # Actually apply the fix:
    python cleanup_orphaned_tags.py

Run this from the ita-package-service directory (or adjust sys.path below)
so it can import the app package.
"""

import argparse
import sys

sys.path.insert(0, ".")  # run from ita-package-service/ so `app` resolves

from app.database import SessionLocal
from app.models import GuestCategoryOption, Package, TourInfo

KIND_TO_TOUR_INFO_COLUMN = {
    "tour_type": "tour_type_tags",
    "package_type": "package_type_tags",
    "traveller": "traveller_types",
}


def clean_column(raw: str, valid_values: set[str]) -> tuple[str, list[str]]:
    """Return (new_raw_value, list_of_dropped_values)."""
    values = [v.strip() for v in raw.split(",") if v.strip()]

    seen = set()
    kept = []
    dropped = []
    for v in values:
        if v not in valid_values:
            dropped.append(v)
            continue
        if v in seen:
            dropped.append(v)  # duplicate, also collapse it while we're here
            continue
        seen.add(v)
        kept.append(v)

    return ",".join(kept), dropped


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no writes")
    parser.add_argument("--shop", default=None, help="Limit to a single shop_domain")
    args = parser.parse_args()

    db = SessionLocal()
    changed_rows = 0
    total_dropped = 0

    try:
        # Build valid-value sets per (shop_domain, kind)
        opt_query = db.query(GuestCategoryOption)
        if args.shop:
            opt_query = opt_query.filter(GuestCategoryOption.shop_domain == args.shop)

        valid_by_shop_kind: dict[tuple[str, str], set[str]] = {}
        for opt in opt_query.all():
            key = (opt.shop_domain, opt.kind)
            valid_by_shop_kind.setdefault(key, set()).add(opt.value)

        # Walk every TourInfo row (joined to Package for shop_domain)
        row_query = db.query(TourInfo, Package.shop_domain).join(
            Package, Package.id == TourInfo.package_id
        )
        if args.shop:
            row_query = row_query.filter(Package.shop_domain == args.shop)

        for tour_info, shop_domain in row_query.all():
            for kind, column_name in KIND_TO_TOUR_INFO_COLUMN.items():
                raw = getattr(tour_info, column_name) or ""
                if not raw.strip():
                    continue

                valid_values = valid_by_shop_kind.get((shop_domain, kind), set())
                new_raw, dropped = clean_column(raw, valid_values)

                if not dropped:
                    continue

                changed_rows += 1
                total_dropped += len(dropped)
                print(
                    f"[{shop_domain}] TourInfo id={tour_info.id} package_id={tour_info.package_id} "
                    f"column={column_name}\n"
                    f"    before: {raw!r}\n"
                    f"    after:  {new_raw!r}\n"
                    f"    dropped: {dropped}"
                )

                if not args.dry_run:
                    setattr(tour_info, column_name, new_raw)

        if args.dry_run:
            print(f"\n[DRY RUN] {changed_rows} row(s) would change, {total_dropped} value(s) would be dropped. "
                  f"No writes made.")
        else:
            db.commit()
            print(f"\nDone. {changed_rows} row(s) updated, {total_dropped} orphaned/duplicate value(s) removed.")

    finally:
        db.close()


if __name__ == "__main__":
    main()