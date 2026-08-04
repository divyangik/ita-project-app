from datetime import datetime, timezone
 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
 
from ..database import get_db
from ..models import Enquiry
from ..schemas import EnquiryCreate, EnquiryRespondUpdate
from ..dependencies import check_internal_key
 
router = APIRouter(prefix="/enquiries", tags=["Enquiries"])
 
def _serialize(e: Enquiry):
    return {
        "id": e.id,
        "package_title": e.package_title,
        "name": e.name,
        "email": e.email,
        "phone": e.phone,
        "message": e.message,
        "lead_responded": bool(e.lead_responded),
        "responded_date": e.responded_date,
        "created_at": e.created_at,
    }
 
 
@router.get("")
def list_enquiries(
    shop: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    enquiries = (
        db.query(Enquiry)
        .filter_by(shop_domain=shop)
        .order_by(Enquiry.created_at.desc())
        .all()
    )
    return [_serialize(e) for e in enquiries]
 
 
@router.post("")
def create_enquiry(
    shop: str,
    payload: EnquiryCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    enquiry = Enquiry(
        shop_domain=shop,
        package_title=payload.package_title,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message,
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return _serialize(enquiry)
 
 
@router.post("/{enquiry_id}/respond")
def update_enquiry_responded(
    enquiry_id: int,
    shop: str,
    payload: EnquiryRespondUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    enquiry = db.query(Enquiry).filter_by(id=enquiry_id, shop_domain=shop).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
 
    enquiry.lead_responded = payload.lead_responded
    enquiry.responded_date = datetime.now(timezone.utc) if payload.lead_responded else None
 
    db.commit()
    db.refresh(enquiry)
    return _serialize(enquiry)
 