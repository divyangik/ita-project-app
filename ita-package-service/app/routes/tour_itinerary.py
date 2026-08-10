from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import uuid
from fastapi import UploadFile, File
from ..database import get_db
from ..dependencies import check_internal_key
from ..models import Package, TourItinerary
from ..schemas import TourItineraryCreate

router = APIRouter(prefix="/tour-itinerary", tags=["Tour Itinerary"])


@router.get("/{package_id}")
def get_tour_itinerary(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    record = db.query(TourItinerary).filter(TourItinerary.package_id == package_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return record


@router.put("/{package_id}")
def save_tour_itinerary(
    package_id: int,
    payload: TourItineraryCreate,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    package = db.query(Package).filter(Package.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    record = db.query(TourItinerary).filter(TourItinerary.package_id == package_id).first()
    data = payload.model_dump()

    if record is None:
        record = TourItinerary(package_id=package_id, **data)
        db.add(record)
    else:
        for key, value in data.items():
            setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "itinerary_pdfs")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000")
MAX_PDF_SIZE = 100 * 1024 * 1024  # 100 MB
@router.post("/{package_id}/upload-pdf")
async def upload_itinerary_pdf(
    package_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    package = db.query(Package).filter(Package.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF must be under 10MB")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{package_id}_{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    file_url = f"{PUBLIC_BASE_URL}/uploads/itinerary_pdfs/{filename}"

    record = db.query(TourItinerary).filter(TourItinerary.package_id == package_id).first()
    if record is None:
        record = TourItinerary(package_id=package_id, itinerary_pdf_url=file_url)
        db.add(record)
    else:
        record.itinerary_pdf_url = file_url

    db.commit()
    db.refresh(record)
    return record

@router.delete("/{package_id}/pdf")
def delete_itinerary_pdf(
    package_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_internal_key),
):
    record = db.query(TourItinerary).filter(TourItinerary.package_id == package_id).first()
    if not record or not record.itinerary_pdf_url:
        raise HTTPException(status_code=404, detail="No itinerary PDF found")

    filename = record.itinerary_pdf_url.rstrip("/").split("/")[-1]
    filepath = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    record.itinerary_pdf_url = None
    db.commit()
    db.refresh(record)
    return record