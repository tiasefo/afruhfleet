from __future__ import annotations

from typing import Optional
from datetime import datetime
import uuid
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_group_member, require_tenant_admin, get_current_user, require_superuser, require_active_subscription
from app.db.session import get_db
from app.models.gallery import GalleryPost, MediaType
from app.models.shipment import GroupMember, GroupMemberRole
from app.models.user import User

router = APIRouter(prefix="/gallery", tags=["Gallery"])


# ----- Schemas -----
class GalleryPostCreate(BaseModel):
    media_url: str
    media_type: MediaType
    caption: Optional[str] = None
    order: int = 0
    tenant_id: Optional[str] = None  # Required for superusers, auto-filled for tenant admins


class GalleryPostUpdate(BaseModel):
    media_url: Optional[str] = None
    caption: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None


class GalleryPostResponse(BaseModel):
    id: str
    tenant_id: str
    media_url: str
    media_type: str
    caption: Optional[str]
    order: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- Routes -----
@router.get("", response_model=list[GalleryPostResponse])
async def list_gallery_posts(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """List all gallery posts for the current tenant (tenant admins) or all posts (superusers)."""
    if current_user.is_superuser:
        # Superusers see all gallery posts across all tenants
        query = select(GalleryPost)
        if active_only:
            query = query.where(GalleryPost.active == True)
        query = query.order_by(GalleryPost.order, GalleryPost.created_at.desc())
        result = db.execute(query)
        posts = result.scalars().all()
        return posts
    elif current_user.tenant_id:
        # Tenant admins see only their tenant's gallery posts
        query = select(GalleryPost).where(GalleryPost.tenant_id == str(current_user.tenant_id))
        if active_only:
            query = query.where(GalleryPost.active == True)
        query = query.order_by(GalleryPost.order, GalleryPost.created_at.desc())
        result = db.execute(query)
        posts = result.scalars().all()
        return posts
    else:
        # Regular users without tenant context see nothing
        return []


@router.post("", response_model=GalleryPostResponse)
async def create_gallery_post(
    post: GalleryPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Create a new gallery post. Tenant admins create for their tenant, superusers can specify tenant_id."""
    if current_user.is_superuser:
        # Superusers can create posts for any tenant
        if not post.tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id required for superusers")
        tenant_id = post.tenant_id
    elif current_user.tenant_id:
        # Tenant admins can only create posts for their own tenant
        tenant_id = str(current_user.tenant_id)
    else:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_post = GalleryPost(
        tenant_id=tenant_id,
        media_url=post.media_url,
        media_type=post.media_type,
        caption=post.caption,
        order=post.order,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@router.get("/{post_id}", response_model=GalleryPostResponse)
async def get_gallery_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Get a specific gallery post. Superusers can access any post, tenant admins only their tenant's posts."""
    query = select(GalleryPost).where(GalleryPost.id == uuid.UUID(post_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only access their tenant's posts
        query = query.where(GalleryPost.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")
    return post


@router.patch("/{post_id}", response_model=GalleryPostResponse)
async def update_gallery_post(
    post_id: str,
    post_update: GalleryPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Update a gallery post. Superusers can update any post, tenant admins only their tenant's posts."""
    query = select(GalleryPost).where(GalleryPost.id == uuid.UUID(post_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only update their tenant's posts
        query = query.where(GalleryPost.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")
    
    if post_update.media_url is not None:
        post.media_url = post_update.media_url
    if post_update.caption is not None:
        post.caption = post_update.caption
    if post_update.order is not None:
        post.order = post_update.order
    if post_update.active is not None:
        post.active = post_update.active
    
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}")
async def delete_gallery_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Delete a gallery post. Superusers can delete any post, tenant admins only their tenant's posts."""
    query = select(GalleryPost).where(GalleryPost.id == uuid.UUID(post_id))
    
    if not current_user.is_superuser and current_user.tenant_id:
        # Tenant admins can only delete their tenant's posts
        query = query.where(GalleryPost.tenant_id == str(current_user.tenant_id))
    
    result = db.execute(query)
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")
    
    db.delete(post)
    db.commit()
    return {"message": "Gallery post deleted successfully"}


@router.post("/upload")
async def upload_gallery_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    """Upload media for gallery post. Returns the media URL."""
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    media_type = MediaType.VIDEO if file_ext in ["mp4", "mov", "avi"] else MediaType.IMAGE
    
    tenant_id = current_user.tenant_id if current_user.tenant_id else "admin"
    static_dir = Path(__file__).resolve().parent / "static" / "gallery" / str(tenant_id)
    static_dir.mkdir(parents=True, exist_ok=True)
    
    saved_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = static_dir / saved_filename
    
    content = await file.read()
    file_path.write_bytes(content)
    
    media_url = f"/static/gallery/{tenant_id}/{saved_filename}"
    
    return {
        "media_url": media_url,
        "media_type": media_type,
        "filename": file.filename
    }
