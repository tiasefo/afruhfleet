from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.marketplace import MarketplaceShipment
from app.api.routes.marketplace import serialize

router = APIRouter(prefix="/admin/marketplace", tags=["Admin Marketplace"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@router.get("/jobs")
def list_jobs():
    db = SessionLocal()
    try:
        return {"jobs": [serialize(x) for x in db.query(MarketplaceShipment).order_by(MarketplaceShipment.created_at.desc()).all()]}
    finally:
        db.close()

@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        job.status = "cancelled"
        job.tracking_status = "cancelled"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()

@router.post("/jobs/{job_id}/reassign/{driver_id}")
def reassign_job(job_id: str, driver_id: str):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        job.assigned_driver_id = driver_id
        job.status = "assigned"
        job.tracking_status = "driver_assigned"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()
