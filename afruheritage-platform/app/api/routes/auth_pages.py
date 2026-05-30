from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
router = APIRouter()
templates = Jinja2Templates(directory='app/templates')

@router.get('/login', response_class=HTMLResponse)
def login_page(tenant_id: str, request: Request):
    """Serve the login page"""
    return templates.TemplateResponse('auth/login.html', {'request': request})

@router.get('/register', response_class=HTMLResponse)
def register_page(tenant_id: str, request: Request):
    """Serve the registration/request access page"""
    return templates.TemplateResponse('auth/register.html', {'request': request})

@router.get('/dashboard', response_class=HTMLResponse)
def dashboard_page(tenant_id: str, request: Request, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    """Serve the tenant dashboard"""
    return templates.TemplateResponse('auth/dashboard.html', {'request': request})

@router.get('/', response_class=HTMLResponse)
def home_page(tenant_id: str, request: Request):
    """Serve the home/landing page"""
    return templates.TemplateResponse('auth/login.html', {'request': request})

@router.get('/forgot-password', response_class=HTMLResponse)
def forgot_password_page(tenant_id: str, request: Request):
    """Serve the forgot password page"""
    return templates.TemplateResponse('auth/login.html', {'request': request})

@router.get('/reset-password', response_class=HTMLResponse)
def reset_password_page(tenant_id: str, request: Request):
    """Serve the password reset page"""
    return templates.TemplateResponse('auth/login.html', {'request': request})
