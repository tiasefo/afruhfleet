from app.core.config import settings
from fastapi import APIRouter
router = APIRouter(tags=['health'])

@router.get('/health')
def healthcheck(tenant_id: str) -> dict[str, str]:
    return {'status': 'ok'}