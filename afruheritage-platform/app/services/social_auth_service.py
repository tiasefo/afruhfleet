from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.core.structured_logging import get_logger
from app.models.user import User
from app.schemas.auth import UserResponse

logger = get_logger("afruheritage.social_auth")


class SocialAuthService:
    """Social authentication service for Google, Instagram, TikTok"""
    
    def __init__(self):
        self.providers = {
            "google": self._get_google_config(),
            "instagram": self._get_instagram_config(),
            "tiktok": self._get_tiktok_config()
        }
    
    def _get_google_config(self) -> dict[str, Any]:
        """Get Google OAuth configuration"""
        return {
            "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
            "client_secret": getattr(settings, "GOOGLE_CLIENT_SECRET", ""),
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            "scope": "openid email profile"
        }
    
    def _get_instagram_config(self) -> dict[str, Any]:
        """Get Instagram OAuth configuration"""
        return {
            "client_id": getattr(settings, "INSTAGRAM_CLIENT_ID", ""),
            "client_secret": getattr(settings, "INSTAGRAM_CLIENT_SECRET", ""),
            "authorize_url": "https://api.instagram.com/oauth/authorize",
            "token_url": "https://api.instagram.com/oauth/access_token",
            "user_info_url": "https://graph.instagram.com/me",
            "scope": "user_profile,user_media"
        }
    
    def _get_tiktok_config(self) -> dict[str, Any]:
        """Get TikTok OAuth configuration"""
        return {
            "client_id": getattr(settings, "TIKTOK_CLIENT_ID", ""),
            "client_secret": getattr(settings, "TIKTOK_CLIENT_SECRET", ""),
            "authorize_url": "https://open-api.tiktok.com/oauth/authorize/",
            "token_url": "https://open-api.tiktok.com/oauth/access_token/",
            "user_info_url": "https://open-api.tiktok.com/user/info/",
            "scope": "user.info.basic"
        }
    
    async def get_authorization_url(self, provider: str, request: Request) -> dict[str, Any]:
        """Get authorization URL for social provider"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not supported")
            
            config = self.providers[provider]
            redirect_uri = f"{settings.base_url}/api/v1/auth/social/{provider}/callback"
            
            if provider == "google":
                return await self._get_google_auth_url(config, redirect_uri)
            elif provider == "instagram":
                return await self._get_instagram_auth_url(config, redirect_uri)
            elif provider == "tiktok":
                return await self._get_tiktok_auth_url(config, redirect_uri)
        
        except Exception as e:
            logger.error("Failed to get authorization URL", extra={
                "provider": provider,
                "error": str(e)
            })
            raise
    
    async def _get_google_auth_url(self, config: dict[str, Any], redirect_uri: str) -> dict[str, Any]:
        """Get Google authorization URL"""
        import urllib.parse
        
        params = {
            "client_id": config["client_id"],
            "redirect_uri": redirect_uri,
            "scope": config["scope"],
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "provider": "google",
            "redirect_uri": redirect_uri
        }
    
    async def _get_instagram_auth_url(self, config: dict[str, Any], redirect_uri: str) -> dict[str, Any]:
        """Get Instagram authorization URL"""
        import urllib.parse
        
        params = {
            "client_id": config["client_id"],
            "redirect_uri": redirect_uri,
            "scope": config["scope"],
            "response_type": "code"
        }
        
        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "provider": "instagram",
            "redirect_uri": redirect_uri
        }
    
    async def _get_tiktok_auth_url(self, config: dict[str, Any], redirect_uri: str) -> dict[str, Any]:
        """Get TikTok authorization URL"""
        import urllib.parse
        
        params = {
            "client_id": config["client_id"],
            "redirect_uri": redirect_uri,
            "scope": config["scope"],
            "response_type": "code"
        }
        
        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "provider": "tiktok",
            "redirect_uri": redirect_uri
        }
    
    async def handle_callback(self, provider: str, code: str, request: Request, db: Session) -> dict[str, Any]:
        """Handle OAuth callback and create/update user"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not supported")
            
            # Exchange code for access token
            token_data = await self._exchange_code_for_token(provider, code)
            
            # Get user info
            user_info = await self._get_user_info(provider, token_data)
            
            # Create or update user
            user = await self._create_or_update_user(db, provider, user_info, token_data)
            
            # Create JWT token
            access_token = create_access_token(data={"sub": str(user.id)})
            
            logger.info("Social authentication successful", extra={
                "provider": provider,
                "user_id": str(user.id),
                "email": user.email
            })
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse.model_validate(user),
                "provider": provider
            }
        
        except Exception as e:
            logger.error("Social authentication failed", extra={
                "provider": provider,
                "error": str(e)
            })
            raise
    
    async def _exchange_code_for_token(self, provider: str, code: str) -> dict[str, Any]:
        """Exchange authorization code for access token"""
        import urllib.parse
        import httpx
        
        config = self.providers[provider]
        redirect_uri = f"{settings.base_url}/api/v1/auth/social/{provider}/callback"
        
        if provider == "google":
            data = {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(config["token_url"], data=data)
                response.raise_for_status()
                return response.json()
        
        elif provider in ["instagram", "tiktok"]:
            # Similar implementation for Instagram and TikTok
            # For now, return mock data
            return {
                "access_token": f"mock_token_{uuid.uuid4().hex[:16]}",
                "expires_in": 3600,
                "token_type": "Bearer"
            }
    
    async def _get_user_info(self, provider: str, token_data: dict[str, Any]) -> dict[str, Any]:
        """Get user information from provider"""
        import httpx
        
        config = self.providers[provider]
        
        if provider == "google":
            headers = {"Authorization": f"Bearer {token_data['access_token']}"}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(config["user_info_url"], headers=headers)
                response.raise_for_status()
                return response.json()
        
        elif provider == "instagram":
            # Instagram API call
            return {
                "id": token_data.get("user_id", f"ig_{uuid.uuid4().hex[:12]}"),
                "username": "instagram_user",
                "email": f"user_{uuid.uuid4().hex[:8]}@instagram.com"
            }
        
        elif provider == "tiktok":
            # TikTok API call
            return {
                "open_id": token_data.get("open_id", f"tt_{uuid.uuid4().hex[:12]}"),
                "union_id": token_data.get("union_id", f"tt_{uuid.uuid4().hex[:12]}"),
                "display_name": "TikTok User"
            }
    
    async def _create_or_update_user(
        self, 
        db: Session, 
        provider: str, 
        user_info: dict[str, Any], 
        token_data: dict[str, Any]
    ) -> User:
        """Create or update user from social login"""
        
        if provider == "google":
            email = user_info.get("email")
            name = user_info.get("name", "")
            provider_id = user_info.get("id")
            avatar_url = user_info.get("picture")
            
        elif provider == "instagram":
            email = user_info.get("email")
            name = user_info.get("username", "")
            provider_id = user_info.get("id")
            avatar_url = None
            
        elif provider == "tiktok":
            # TikTok doesn't provide email by default
            email = f"user_{user_info.get('open_id', uuid.uuid4().hex[:8])}@tiktok.com"
            name = user_info.get("display_name", "")
            provider_id = user_info.get("open_id")
            avatar_url = None
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Check if user exists
        user = db.query(User).filter(
            User.email == email
        ).first()
        
        if user:
            # Update existing user
            user.full_name = name
            user.avatar_url = avatar_url
            user.last_login = datetime.utcnow()
            
            # Update social account info
            if not hasattr(user, 'social_accounts'):
                user.social_accounts = {}
            
            user.social_accounts[provider] = {
                "provider_id": provider_id,
                "access_token": token_data.get("access_token"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
        else:
            # Create new user
            user = User(
                email=email,
                full_name=name,
                avatar_url=avatar_url,
                is_active=True,
                is_superuser=False,
                is_tenant_admin=False,
                last_login=datetime.utcnow(),
                social_accounts={
                    provider: {
                        "provider_id": provider_id,
                        "access_token": token_data.get("access_token"),
                        "created_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    def get_supported_providers(self) -> list[dict[str, Any]]:
        """Get list of supported social providers"""
        return [
            {
                "provider": "google",
                "name": "Google",
                "available": bool(self.providers["google"]["client_id"]),
                "icon": "google",
                "color": "#4285F4"
            },
            {
                "provider": "instagram",
                "name": "Instagram",
                "available": bool(self.providers["instagram"]["client_id"]),
                "icon": "instagram",
                "color": "#E4405F"
            },
            {
                "provider": "tiktok",
                "name": "TikTok",
                "available": bool(self.providers["tiktok"]["client_id"]),
                "icon": "tiktok",
                "color": "#000000"
            }
        ]


# Global social auth service
def get_social_auth_service() -> SocialAuthService:
    """Get social authentication service"""
    return SocialAuthService()
