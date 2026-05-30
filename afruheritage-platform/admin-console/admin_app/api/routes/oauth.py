from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import httpx
import uuid
from urllib.parse import urlencode

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.services.audit_service import record_admin_audit

router = APIRouter(prefix="/oauth", tags=["Admin – OAuth"])

# OAuth Providers Configuration
OAUTH_PROVIDERS = {
    "google": {
        "client_id": "your-google-client-id",
        "client_secret": "your-google-client-secret",
        "auth_url": "https://accounts.google.com/o/oauth2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "scope": "openid email profile"
    },
    "instagram": {
        "client_id": "your-instagram-client-id", 
        "client_secret": "your-instagram-client-secret",
        "auth_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "userinfo_url": "https://graph.instagram.com/me",
        "scope": "user_profile,user_media"
    },
    "linkedin": {
        "client_id": "your-linkedin-client-id",
        "client_secret": "your-linkedin-client-secret", 
        "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
        "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
        "userinfo_url": "https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)",
        "scope": "r_liteprofile r_emailaddress"
    }
}

@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request):
    """Initiate OAuth login for specified provider"""
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Provider {provider} not supported")
    
    config = OAUTH_PROVIDERS[provider]
    
    # Generate state parameter for security
    state = str(uuid.uuid4())
    
    # Build OAuth URL
    params = {
        "client_id": config["client_id"],
        "redirect_uri": f"http://127.0.0.1:4000/admin/oauth/{provider}/callback",
        "scope": config["scope"],
        "response_type": "code",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    auth_url = f"{config['auth_url']}?{urlencode(params)}"
    
    return {
        "authorization_url": auth_url,
        "state": state,
        "provider": provider
    }

@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from provider"""
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Provider {provider} not supported")
    
    config = OAUTH_PROVIDERS[provider]
    
    try:
        # Exchange authorization code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                config["token_url"],
                data={
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"http://127.0.0.1:4000/admin/oauth/{provider}/callback"
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="No access token received")
            
            # Get user info from provider
            userinfo_response = await client.get(
                config["userinfo_url"],
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            userinfo = userinfo_response.json()
            
            # Extract user data based on provider
            if provider == "google":
                email = userinfo.get("email")
                name = userinfo.get("name")
                provider_id = userinfo.get("id")
            elif provider == "instagram":
                email = f"user_{userinfo.get('id')}@instagram.local"
                name = f"Instagram User {userinfo.get('id')}"
                provider_id = userinfo.get("id")
            elif provider == "linkedin":
                email = userinfo.get("emailAddress")
                name = f"{userinfo.get('firstName', {}).get('localized', {}).get('en', '')} {userinfo.get('lastName', {}).get('localized', {}).get('en', '')}"
                provider_id = userinfo.get("id")
            
            # Here you would typically:
            # 1. Check if user exists in your database
            # 2. Create or update user record
            # 3. Create session or token
            
            return {
                "message": "OAuth authentication successful",
                "provider": provider,
                "user": {
                    "email": email,
                    "name": name,
                    "provider_id": provider_id
                },
                "access_token": access_token
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth authentication failed: {str(e)}")

@router.get("/providers")
async def list_providers():
    """List available OAuth providers"""
    return {
        "providers": list(OAUTH_PROVIDERS.keys()),
        "configured": {
            provider: bool(config["client_id"] and config["client_secret"] != f"your-{provider}-client-secret")
            for provider, config in OAUTH_PROVIDERS.items()
        }
    }
