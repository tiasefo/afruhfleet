from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.marketplace import MarketplaceShipment
from app.api.routes.marketplace import serialize
from app.api.deps import require_superuser
from app.models.user import User

router = APIRouter(prefix="/admin/marketplace", tags=["Admin Marketplace"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@router.get("/jobs")
def list_jobs(_: User = Depends(require_superuser)):
    db = SessionLocal()
    try:
        return {"jobs": [serialize(x) for x in db.query(MarketplaceShipment).order_by(MarketplaceShipment.created_at.desc()).all()]}
    finally:
        db.close()

@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, _: User = Depends(require_superuser)):
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
def reassign_job(job_id: str, driver_id: str, _: User = Depends(require_superuser)):
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

@router.get("/jobs/{job_id}/eligible-drivers")
def get_eligible_drivers(job_id: str, _: User = Depends(require_superuser)):
    """Return list of eligible drivers for a job (for reassignment picker)."""
    from app.models.vendor import DeliveryVendor
    from app.models.user import User, UserRole
    
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        
        # Get approved vendors with delivery_driver role users
        vendors = db.query(DeliveryVendor).filter(
            DeliveryVendor.status == "approved"
        ).all()
        
        eligible_drivers = []
        for vendor in vendors:
            # Get users associated with this vendor who are delivery drivers
            users = db.query(User).filter(
                User.role == UserRole.delivery_driver
            ).all()
            
            for user in users:
                eligible_drivers.append({
                    "driver_id": str(user.id),
                    "driver_name": user.full_name or user.email,
                    "vendor_id": str(vendor.id),
                    "vendor_name": vendor.business_name,
                    "vehicle_type": vendor.vehicle_type,
                    "region": vendor.operating_region,
                    "rating": vendor.rating or 0.0,
                })
        
        return {"eligible_drivers": eligible_drivers}
    finally:
        db.close()
