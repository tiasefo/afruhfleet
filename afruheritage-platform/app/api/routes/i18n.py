from __future__ import annotations
from app.core.config import settings
from fastapi import APIRouter, Header, Query
from app.core.i18n import SUPPORTED_LANGUAGES, _translations, detect_language, t
router = APIRouter(prefix='/i18n', tags=['Internationalization'])

@router.get('/translations/{lang}')
def get_translations(tenant_id: str, lang: str):
    if lang not in SUPPORTED_LANGUAGES:
        lang = 'en'
    return _translations.get(lang, {})

@router.get('/languages')
def get_supported_languages(tenant_id: str):
    return {'supported': sorted(SUPPORTED_LANGUAGES), 'default': 'en'}

@router.get('/detect')
def detect_user_language(tenant_id: str, accept_language: str | None=Header(None, alias='Accept-Language')):
    return {'detected': detect_language(accept_language)}
