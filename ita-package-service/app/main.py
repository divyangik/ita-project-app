from fastapi import FastAPI
import os
from fastapi.staticfiles import StaticFiles
from .routes.dashboard import router as dashboard_router
from .database import Base, engine
from .routes.packages import router as package_router
from app.routes import tour_info
from .routes import tour_dates
from .routes.tour_capacity import router as tour_capacity_router
from .routes.tour_pricing import router as tour_pricing_router
from .routes.tour_payment import router as tour_payment_router
from .routes.tour_guest_addons import router as tour_guest_addons_router
from .routes.tour_includes import router as tour_includes_router
from .routes.include_options import router as include_options_router
from .routes.package_include_selections import (
    router as package_include_selections_router,
)
from .routes.enquiries import router as enquiry_router
from .routes.storefront import router as storefront_router
from fastapi.middleware.cors import CORSMiddleware
from .routes.tour_itinerary import router as tour_itinerary_router
from .routes.package_countries import router as package_countries_router
from .routes.package_cities import router as package_cities_router
from .routes.guest_category_options import router as guest_category_options_router
from .routes.tour_product_addons import router as tour_product_addons_router

# Create all database tables
Base.metadata.create_all(bind=engine)

# --- Lightweight column migration -----------------------------------------
# `create_all` only creates missing tables, it never alters existing ones.
# guest_category_options already exists in production, so the new
# `message` column has to be added by hand here. Safe to run on every
# startup: the ALTER is skipped once the column exists.
def _ensure_guest_category_options_message_column():
    from sqlalchemy import text, inspect

    inspector = inspect(engine)
    if "guest_category_options" not in inspector.get_table_names():
        return

    existing_columns = {
        col["name"] for col in inspector.get_columns("guest_category_options")
    }
    if "message" in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE guest_category_options ADD COLUMN message VARCHAR(255)")
        )


_ensure_guest_category_options_message_column()
app = FastAPI(
    title="ITA Package Service",
    version="1.0.0",
)

# Local disk storage for uploaded itinerary PDFs, served at /uploads/...
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "itinerary_pdfs"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Allow the storefront (and any custom domain you later add) to call this
# API directly from the browser, without going through Shopify App Proxy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ita3-0.myshopify.com",
        # "https://your-custom-domain.com",  # add when you have one
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Register routes
app.include_router(package_router)
app.include_router(dashboard_router)
app.include_router(tour_info.router)
app.include_router(tour_dates.router)
app.include_router(tour_capacity_router)
app.include_router(tour_pricing_router)
app.include_router(tour_payment_router)
app.include_router(tour_guest_addons_router)
app.include_router(tour_includes_router)
app.include_router(include_options_router)
app.include_router(package_include_selections_router)
app.include_router(enquiry_router)
app.include_router(storefront_router)
app.include_router(tour_itinerary_router)
app.include_router(package_countries_router)
app.include_router(package_cities_router)
app.include_router(guest_category_options_router)
app.include_router(tour_product_addons_router)



@app.get("/")
def root():
    return {
        "message": "ITA Package Service is running"
    }