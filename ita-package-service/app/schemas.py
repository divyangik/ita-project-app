from decimal import Decimal
from datetime import date
from typing import List
from pydantic import BaseModel
from datetime import date, datetime 

class PackageCreate(BaseModel):
    title: str
    destination: str
    region: str
    base_price: Decimal
    payment_status: str
    duration: str
    status: str
    shopify_product_id: str | None = None
    shopify_variant_id: str | None = None
    shopify_collection_id: str | None = None


class PackageUpdate(BaseModel):
    title: str | None = None
    destination: str | None = None
    region: str | None = None
    base_price: Decimal | None = None
    payment_status: str | None = None
    duration: str | None = None
    status: str | None = None
    shopify_product_id: str | None = None
    shopify_variant_id: str | None = None
    shopify_collection_id: str | None = None


class TourInfoBase(BaseModel):
    tour_title: str | None = None
    duration_label: str | None = None
    departure_city: str | None = None
    start_city: str | None = None
    end_city: str | None = None

    days: int | None = None
    nights: int | None = None

    country: str | None = None
    region: str | None = None
    category: str | None = None

    short_description: str | None = None

    tour_type_tags: List[str] = []

    featured: bool = False
    product_code: str | None = None
    custom_date_message: str | None = None

class TourInfoCreate(TourInfoBase):
    pass


class TourInfoResponse(TourInfoBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True


class TourDateBase(BaseModel):
    departure_date: date
    return_date: date
    seats_total: int = 0
    seats_available: int = 0
    adult_price: Decimal
    child_price: Decimal | None = None
    single_supplement: Decimal | None = None
    is_default: bool = False
    status: str = "Available"
    notes: str | None = None


class TourDateCreate(TourDateBase):
    package_id: int


class TourDateResponse(TourDateBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True
class TourCapacityBase(BaseModel):
    max_group_size: int | None = None
    min_group_size: int | None = None

    minimum_age: int | None = None
    maximum_age: int | None = None

    child_allowed: bool = True
    infant_allowed: bool = True

    wheelchair_accessible: bool = False

    fitness_level: str = "Easy"

    passport_required: bool = True
    visa_required: bool = False

    notes: str | None = None

    custom_package_type: str | None = None
    custom_package_message: str | None = None

    extra_nights_type: str | None = None
    extra_nights_price: int = 0
    extra_nights_count: int = 1

    private_rooms_type: str | None = None
    private_rooms_price: int = 0
    private_rooms_count: int = 1
    
    couple_room_type: str | None = None
    couple_room_price: int = 0
    couple_room_count: int = 1

    child_room_type: str | None = None
    child_room_price: int = 0
    child_room_count: int = 1
class PackageResponse(PackageCreate):
    id: int
    package_code: str
    shop_domain: str
    created_at: datetime
    tour_dates: List["TourDateResponse"] = []

    class Config:
        from_attributes = True


class TourCapacityCreate(TourCapacityBase):
    pass


class TourCapacityResponse(TourCapacityBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True

# ==========================
# Tour Pricing
# ==========================

class TourPricingBase(BaseModel):
    price_per_person: Decimal
    currency: str = "USD"
    price_note: str | None = None


class TourPricingCreate(TourPricingBase):
    pass


class TourPricingResponse(TourPricingBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True


# ==========================
# Tour Payment Option
# ==========================

class TourPaymentBase(BaseModel):
    payment_status: str = "Unpaid"
    amount_received: Decimal = 0
    deposit_amount: Decimal = 0
    balance_amount: Decimal = 0
    number_of_installments: int = 1
    installment_label: str | None = None
    option_label: str | None = None
    cta_text: str | None = None
    show_deal_price_badge: bool = True
    preselect_full_payment: bool = True


class TourPaymentCreate(TourPaymentBase):
    pass


class TourPaymentResponse(TourPaymentBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True


# ==========================
# Tour Guest Addon
# ==========================

class TourGuestAddonBase(BaseModel):
    addon_name: str
    description: str | None = None
    price: Decimal = 0
    visible: bool = True
    display_order: int = 1


class TourGuestAddonCreate(TourGuestAddonBase):
    pass


class TourGuestAddonResponse(TourGuestAddonBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True
        
        

class TourIncludesBase(BaseModel):
    # Package Includes
    hotels: bool = False
    transport: bool = False
    sightseeing: bool = False
    activities: bool = False
    food: bool = False
    beverage: bool = False
    flights: bool = False
    insurance: bool = False
    water_sports: bool = False
    cycling: bool = False
    spa: bool = False
    wifi: bool = False

    # Hero Image
    hero_image: str | None = None
    image_alt_text: str | None = None

    # CTA Buttons
    primary_label: str | None = None
    primary_url: str | None = None

    secondary_label: str | None = None
    enquiry_email_or_url: str | None = None

    show_selection_summary: bool = False
    itinerary_pdf: str | None = None
    itinerary_pdf_filename: str | None = None

class TourIncludesCreate(TourIncludesBase):
    pass


class TourIncludesResponse(TourIncludesBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True

        
class EnquiryBase(BaseModel):
    package_title: str | None = None
    name: str
    email: str
    phone: str
    message: str | None = None


class EnquiryCreate(EnquiryBase):
    pass


class EnquiryRespondUpdate(BaseModel):
    lead_responded: bool


class EnquiryResponse(EnquiryBase):
    id: int
    shop_domain: str
    lead_responded: bool
    responded_date: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True

class PackageCountryBase(BaseModel):
    name: str
    display_order: int = 1


class PackageCountryCreate(PackageCountryBase):
    pass


class PackageCountryResponse(PackageCountryBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True


class PackageCityBase(BaseModel):
    name: str
    display_order: int = 1


class PackageCityCreate(PackageCityBase):
    pass


class PackageCityResponse(PackageCityBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True