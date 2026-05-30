from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.runner import RunnerNode
from app.models.user import User
from app.schemas.runner import RunnerCreate, RunnerResponse
from app.services.audit_service import record_audit_event
router = APIRouter(prefix='/runners', tags=['runners'])

@router.post('', response_model=RunnerResponse)
def create_runner(payload: RunnerCreate, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)) -> RunnerNode:
    existing = db.scalar(select(RunnerNode).where((RunnerNode.name == payload.name) | (RunnerNode.host == payload.host)))
    if existing:
        raise HTTPException(status_code=409, detail='Runner node already exists')
    runner = RunnerNode(**payload.model_dump(), is_active=True)
    db.add(runner)
    db.commit()
    db.refresh(runner)
    record_audit_event(db, current_user, 'runner.created', 'runner', str(runner.id), {'host': runner.host})
    return runner

@router.get('', response_model=list[RunnerResponse])
def list_runners(db: Session=Depends(get_db), _: User=Depends(require_superuser)) -> list[RunnerNode]:
    return list(db.scalars(select(RunnerNode).order_by(RunnerNode.created_at.desc())).all())