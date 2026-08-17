from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    TIMESTAMP,
    DateTime,
    Date,
    DECIMAL,
    Numeric,
    Boolean,
    ForeignKey,
    text,
)
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship

from .database import Base


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)

    package_code = Column(String(50), unique=True, nullable=False)
    shop_domain = Column(String(255), nullable=False)

    title = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    region = Column(String(100), nullable=False)

    base_price = Column(DECIMAL(10, 2), nullable=False)

    payment_status = Column(
        Enum(
            "Unpaid",
            "Deposit paid",
            "Partial payment",
            "Fully paid",
            name="payment_status_enum",
        ),
        default="Unpaid",
    )

    duration = Column(String(100), nullable=False)

    status = Column(
        Enum(
            "Draft",
            "Published",
            "Archived",
            name="package_status_enum",
        ),
        default="Draft",
    )

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )
    shopify_product_id = Column(String(100), nullable=True)
    shopify_variant_id = Column(String(100), nullable=True)
    shopify_collection_id = Column(String(100), nullable=True)
    # One Package -> One TourInfo
    tour_info = relationship(
        "TourInfo",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> Many TourDates
    tour_dates = relationship(
        "TourDate",
        back_populates="package",
        cascade="all, delete-orphan",
    )

    # One Package -> One TourCapacity
    tour_capacity = relationship(
        "TourCapacity",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> One TourPricing
    tour_pricing = relationship(
        "TourPricing",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> One TourPaymentOption
    tour_payment_option = relationship(
        "TourPaymentOption",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> Many TourGuestAddon
    tour_guest_addons = relationship(
        "TourGuestAddon",
        back_populates="package",
        cascade="all, delete-orphan",
    )

    # One Package -> One TourIncludes (checkbox toggles)
    tour_includes = relationship(
        "TourIncludes",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> One TourCTAButtons
    tour_cta_buttons = relationship(
        "TourCTAButtons",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> One TourHeroImages
    tour_hero_images = relationship(
        "TourHeroImages",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    tour_itinerary = relationship(
        "TourItinerary",
        back_populates="package",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One Package -> Many TourProductAddon
    product_addons = relationship(
        "TourProductAddon",
        back_populates="package",
        cascade="all, delete-orphan",
    )
    
    # One Package -> Many PackageCountry
    countries = relationship(
        "PackageCountry",
        back_populates="package",
        cascade="all, delete-orphan",
    )

    # One Package -> Many PackageCity
    cities = relationship(
        "PackageCity",
        back_populates="package",
        cascade="all, delete-orphan",
    )

class TourInfo(Base):
    __tablename__ = "tour_info"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    tour_title = Column(String(255))
    duration_label = Column(String(100))

    departure_city = Column(String(150))
    start_city = Column(String(150))
    end_city = Column(String(150))

    days = Column(Integer)
    nights = Column(Integer)

    country = Column(String(150))
    region = Column(String(150))
    category = Column(String(150))

    short_description = Column(Text)

    # Stored as:
    # "Adventure,Beach,Group Tour"
    tour_type_tags = Column(Text, nullable=True)

    # Stored as comma-separated text, same pattern as tour_type_tags.
    package_type_tags = Column(Text, nullable=True)
    traveller_types = Column(Text, nullable=True)

    featured = Column(Boolean, default=False)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship(
        "Package",
        back_populates="tour_info",
    )


class TourDate(Base):
    __tablename__ = "tour_dates"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
    )

    departure_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=False)

    seats_total = Column(Integer, default=0)
    seats_available = Column(Integer, default=0)

    adult_price = Column(DECIMAL(10, 2), nullable=False)
    child_price = Column(DECIMAL(10, 2), nullable=True)
    single_supplement = Column(DECIMAL(10, 2), nullable=True)

    is_default = Column(Boolean, default=False)

    status = Column(
        Enum(
            "Available",
            "Guaranteed",
            "Sold Out",
            "Cancelled",
            name="tour_date_status_enum",
        ),
        default="Available",
    )

    notes = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship("Package", back_populates="tour_dates")

class TourCapacity(Base):
    __tablename__ = "tour_capacity"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    max_group_size = Column(Integer)
    min_group_size = Column(Integer)

    minimum_age = Column(Integer)
    maximum_age = Column(Integer)

    child_allowed = Column(Boolean, default=True)
    infant_allowed = Column(Boolean, default=True)

    wheelchair_accessible = Column(Boolean, default=False)

    fitness_level = Column(
        Enum(
            "Easy",
            "Moderate",
            "Challenging",
            "Difficult",
            name="fitness_level_enum",
        ),
        default="Easy",
    )

    passport_required = Column(Boolean, default=True)
    visa_required = Column(Boolean, default=False)

    notes = Column(Text)

    # -------- New fields for custom package/extra options --------
    custom_package_type = Column(String(255))
    custom_package_message = Column(Text)

    extra_nights_type = Column(String(255))
    extra_nights_price = Column(Integer, default=0)
    extra_nights_count = Column(Integer, default=1)

    private_rooms_type = Column(String(255))
    private_rooms_price = Column(Integer, default=0)
    private_rooms_count = Column(Integer, default=1)

    couple_room_type = Column(String(255))
    couple_room_price = Column(Integer, default=0)
    couple_room_count = Column(Integer, default=1)

    child_room_type = Column(String(255))
    child_room_price = Column(Integer, default=0)
    child_room_count = Column(Integer, default=1)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship(
        "Package",
        back_populates="tour_capacity",
    )

class TourPricing(Base):
    __tablename__ = "tour_pricing"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    price_per_person = Column(Numeric(10, 2), nullable=False)

    currency = Column(String(10), default="USD")

    price_note = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    package = relationship("Package", back_populates="tour_pricing")


class TourPaymentOption(Base):
    __tablename__ = "tour_payment_options"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    payment_status = Column(String(50), default="Unpaid")

    amount_received = Column(Numeric(10, 2), default=0)

    deposit_amount = Column(Numeric(10, 2), default=0)

    number_of_installments = Column(Integer, default=1)

    option_label = Column(String(255))

    show_deal_price_badge = Column(Boolean, default=True)

    preselect_full_payment = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    package = relationship("Package", back_populates="tour_payment_option")


class TourGuestAddon(Base):
    __tablename__ = "tour_guest_addons"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
    )

    addon_name = Column(String(255), nullable=False)

    description = Column(Text)

    price = Column(Numeric(10, 2), default=0)

    visible = Column(Boolean, default=True)

    display_order = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    package = relationship("Package", back_populates="tour_guest_addons")


class TourIncludes(Base):
    """Package includes checkbox toggles (hotels, transport, food, etc)."""

    __tablename__ = "tour_includes"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    hotels = Column(Boolean, default=False)
    transport = Column(Boolean, default=False)
    sightseeing = Column(Boolean, default=False)
    activities = Column(Boolean, default=False)
    food = Column(Boolean, default=False)
    beverage = Column(Boolean, default=False)
    flights = Column(Boolean, default=False)
    insurance = Column(Boolean, default=False)
    water_sports = Column(Boolean, default=False)
    cycling = Column(Boolean, default=False)
    spa = Column(Boolean, default=False)
    wifi = Column(Boolean, default=False)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship("Package", back_populates="tour_includes")


class TourCTAButtons(Base):
    """Booking widget CTA button labels/links for a package."""

    __tablename__ = "tour_cta_buttons"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    primary_label = Column(String(255))
    primary_url = Column(String(500))

    secondary_label = Column(String(255))
    enquiry_email_or_url = Column(String(255))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship("Package", back_populates="tour_cta_buttons")


class TourHeroImages(Base):
    """Hero image + alt text + selection-summary toggle for a package."""

    __tablename__ = "tour_hero_images"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # LONGTEXT because images are currently stored as base64 data URLs.
    hero_image = Column(LONGTEXT)
    image_alt_text = Column(String(255))

    show_selection_summary = Column(Boolean, default=False)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    package = relationship("Package", back_populates="tour_hero_images")


class GuestCategoryOption(Base):
    """Shop-level library of Package Type / Traveller / Tour Type options.

    `kind` distinguishes the lists ("package_type", "traveller", or
    "tour_type") so all are managed from one table, one settings page,
    one CRUD route.
    """

    __tablename__ = "guest_category_options"

    id = Column(Integer, primary_key=True, index=True)
    shop_domain = Column(String(255), nullable=False)

    kind = Column(String(30), nullable=False)  # "package_type" | "traveller" | "tour_type"
    name = Column(String(100), nullable=False)
    value = Column(String(100), nullable=False)

    display_order = Column(Integer, default=0)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )


class IncludeOption(Base):
    """Shop-level library of 'package includes' items (name + icon SVG)."""

    __tablename__ = "include_options"

    id = Column(Integer, primary_key=True, index=True)
    shop_domain = Column(String(255), nullable=False)

    name = Column(String(100), nullable=False)
    svg = Column(Text, nullable=False)

    display_order = Column(Integer, default=0)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )


class PackageIncludeSelection(Base):
    """Which include_options are toggled on for a given package."""

    __tablename__ = "package_include_selections"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
    )
    include_option_id = Column(
        Integer,
        ForeignKey("include_options.id", ondelete="CASCADE"),
        nullable=False,
    )


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    shop_domain = Column(String(255), nullable=False)

    package_title = Column(String(255), nullable=True)

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    message = Column(Text, nullable=True)

    lead_responded = Column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )

    responded_date = Column(TIMESTAMP, nullable=True)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )

class PackageCountry(Base):
    __tablename__ = "package_countries"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(150), nullable=False)
    display_order = Column(Integer, default=1)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    package = relationship("Package", back_populates="countries")


class PackageCity(Base):
    __tablename__ = "package_cities"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(150), nullable=False)
    display_order = Column(Integer, default=1)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    package = relationship("Package", back_populates="cities")

class TourItinerary(Base):
    __tablename__ = "tour_itinerary"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    itinerary_pdf_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("Package", back_populates="tour_itinerary")

class TourProductAddon(Base):
    __tablename__ = "tour_product_addons"

    id = Column(Integer, primary_key=True, index=True)

    package_id = Column(
        Integer,
        ForeignKey("packages.id", ondelete="CASCADE"),
        nullable=False,
    )

    shopify_product_id = Column(String(100), nullable=False)
    shopify_variant_id = Column(String(100), nullable=True)
    product_title = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    package = relationship("Package", back_populates="product_addons")