from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.security import create_access_token
from app.core.structured_logging import get_logger
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.signup_onboarding_service import ensure_user_tenant_context

logger = get_logger("afruheritage.social_auth")


class SocialAuthService:
    """Social authentication service for Google, Instagram, Facebook, TikTok"""
    
    def __init__(self):
        self.providers = {
            "google": self._get_google_config(),
            "instagram": self._get_instagram_config(),
            "facebook": self._get_facebook_config(),
            "tiktok": self._get_tiktok_config()
        }
    
    def _get_google_config(self) -> dict[str, Any]:
        """Get Google OAuth configuration"""
        return {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            "scope": "openid email profile"
        }
    
    def _get_instagram_config(self) -> dict[str, Any]:
        """Get Instagram OAuth configuration.
        NOTE: Instagram Basic Display API was deprecated Dec 4, 2024.
        We now use Facebook Login (same app_id) with instagram_basic scope,
        which works for any Facebook app that has Instagram Login product added.
        """
        return {
            "client_id": settings.instagram_client_id,
            "client_secret": settings.instagram_client_secret,
            "redirect_uri": settings.instagram_redirect_uri,
            "authorize_url": "https://www.facebook.com/v20.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v20.0/oauth/access_token",
            "user_info_url": "https://graph.facebook.com/me",
            "scope": "instagram_basic,email,public_profile"
        }

    def _get_facebook_config(self) -> dict[str, Any]:
        """Get Facebook OAuth configuration"""
        return {
            "client_id": settings.facebook_client_id,
            "client_secret": settings.facebook_client_secret,
            "redirect_uri": settings.facebook_redirect_uri,
            "authorize_url": "https://www.facebook.com/v20.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v20.0/oauth/access_token",
            "user_info_url": "https://graph.facebook.com/me",
            "scope": "public_profile,email"
        }
    
    def _get_tiktok_config(self) -> dict[str, Any]:
        """Get TikTok OAuth configuration"""
        return {
            "client_id": settings.tiktok_client_id,
            "client_secret": settings.tiktok_client_secret,
            "redirect_uri": settings.tiktok_redirect_uri,
            "authorize_url": "https://www.tiktok.com/v2/auth/authorize/",
            "token_url": "https://open.tiktokapis.com/v2/oauth/token/",
            "user_info_url": "https://open.tiktokapis.com/v2/user/info/",
            "scope": "user.info.basic"
        }
    
    async def get_authorization_url(self, provider: str, request: Request) -> dict[str, Any]:
        """Get authorization URL for social provider"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not supported")
            
            config = self.providers[provider]
            redirect_uri = config.get("redirect_uri") or str(request.url_for("social_callback", provider=provider))
            
            if provider == "google":
                return await self._get_google_auth_url(config, redirect_uri)
            elif provider == "instagram":
                return await self._get_instagram_auth_url(config, redirect_uri)
            elif provider == "facebook":
                return await self._get_facebook_auth_url(config, redirect_uri)
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
            "prompt": "consent",
            "state": uuid.uuid4().hex,
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
            "response_type": "code",
            "state": uuid.uuid4().hex,
        }
        
        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "provider": "instagram",
            "redirect_uri": redirect_uri
        }

    async def _get_facebook_auth_url(self, config: dict[str, Any], redirect_uri: str) -> dict[str, Any]:
        """Get Facebook authorization URL"""
        import urllib.parse

        params = {
            "client_id": config["client_id"],
            "redirect_uri": redirect_uri,
            "scope": config["scope"],
            "response_type": "code",
            "state": uuid.uuid4().hex,
        }

        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"

        return {
            "authorization_url": auth_url,
            "provider": "facebook",
            "redirect_uri": redirect_uri
        }
    
    async def _get_tiktok_auth_url(self, config: dict[str, Any], redirect_uri: str) -> dict[str, Any]:
        """Get TikTok authorization URL"""
        import urllib.parse
        
        params = {
            "client_key": config["client_id"],
            "redirect_uri": redirect_uri,
            "scope": config["scope"],
            "response_type": "code",
            "state": uuid.uuid4().hex,
        }
        
        auth_url = f"{config['authorize_url']}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "provider": "tiktok",
            "redirect_uri": redirect_uri
        }
    
    async def handle_callback(self, provider: str, code: str, request: Request | None, db: Session, redirect_uri: str | None = None) -> dict[str, Any]:
        """Handle OAuth callback and create/update user"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not supported")
            
            # Exchange code for access token
            token_data = await self._exchange_code_for_token(provider, code, request=request, redirect_uri=redirect_uri)
            
            # Get user info
            user_info = await self._get_user_info(provider, token_data)
            
            # Create or update user
            user = await self._create_or_update_user(db, provider, user_info, token_data)
            
            # Create JWT token
            access_token = create_access_token(str(user.id))
            
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
    
    async def _exchange_code_for_token(self, provider: str, code: str, request: Request | None = None, redirect_uri: str | None = None) -> dict[str, Any]:
        """Exchange authorization code for access token"""
        import httpx

        def _format_oauth_error(prefix: str, exc: Exception) -> ValueError:
            if isinstance(exc, httpx.HTTPStatusError):
                status = exc.response.status_code
                try:
                    payload = exc.response.json()
                except Exception:
                    payload = {"raw": (exc.response.text or "")[:400]}
                message = f"{prefix} (status={status}): {payload}"
                logger.warning(
                    "OAuth provider returned non-success response",
                    extra={"provider": provider, "status_code": status, "payload": payload},
                )
                return ValueError(message)

            if isinstance(exc, httpx.RequestError):
                message = f"{prefix}: network error contacting provider"
                logger.warning(
                    "OAuth provider network error",
                    extra={"provider": provider, "error": str(exc)},
                )
                return ValueError(message)

            return ValueError(f"{prefix}: {str(exc)}")
        
        config = self.providers[provider]
        effective_redirect_uri = redirect_uri
        if not effective_redirect_uri:
            effective_redirect_uri = config.get("redirect_uri")
        if not effective_redirect_uri and request is not None:
            effective_redirect_uri = str(request.url_for("social_callback", provider=provider))
        if not effective_redirect_uri:
            base = settings.cors_origins[0] if settings.cors_origins else "http://localhost:8100"
            effective_redirect_uri = f"{base.rstrip('/')}/api/v1/auth/social/{provider}/callback"
        
        if provider == "google":
            data = {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": effective_redirect_uri
            }

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(config["token_url"], data=data)
                    response.raise_for_status()
                    return response.json()
            except Exception as exc:
                raise _format_oauth_error("google token exchange failed", exc) from exc
        
        elif provider == "instagram":
            # Instagram now uses Facebook OAuth - same GET request as Facebook
            params = {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": effective_redirect_uri,
                "code": code,
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(config["token_url"], params=params)
                    response.raise_for_status()
                    return response.json()
            except Exception as exc:
                raise _format_oauth_error("instagram token exchange failed", exc) from exc

        elif provider == "facebook":
            params = {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": effective_redirect_uri,
                "code": code,
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(config["token_url"], params=params)
                    response.raise_for_status()
                    return response.json()
            except Exception as exc:
                raise _format_oauth_error("facebook token exchange failed", exc) from exc

        elif provider == "tiktok":
            payload = {
                "client_key": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": effective_redirect_uri,
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(config["token_url"], json=payload)
                    response.raise_for_status()
                    body = response.json()
                    return body.get("data", body)
            except Exception as exc:
                raise _format_oauth_error("tiktok token exchange failed", exc) from exc

        raise ValueError(f"Provider {provider} token exchange unsupported")
    
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
            # Use Facebook Graph API (same as Facebook flow) since we now use Facebook OAuth
            params = {
                "fields": "id,name,email",
                "access_token": token_data["access_token"],
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(config["user_info_url"], params=params)
                response.raise_for_status()
                body = response.json()
                if "email" not in body:
                    body["email"] = f"ig_{body.get('id', uuid.uuid4().hex[:8])}@instagram.local"
                return body

        elif provider == "facebook":
            params = {
                "fields": "id,name,email",
                "access_token": token_data["access_token"],
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(config["user_info_url"], params=params)
                response.raise_for_status()
                body = response.json()
                if "email" not in body:
                    body["email"] = f"fb_{body.get('id', uuid.uuid4().hex[:8])}@facebook.local"
                return body
        
        elif provider == "tiktok":
            headers = {
                "Authorization": f"Bearer {token_data['access_token']}",
                "Content-Type": "application/json",
            }
            payload = {
                "fields": ["open_id", "union_id", "display_name", "avatar_url"],
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(config["user_info_url"], headers=headers, json=payload)
                response.raise_for_status()
                body = response.json()
                data = body.get("data", {}).get("user", body.get("user", body.get("data", {})))
                if "open_id" not in data:
                    data["open_id"] = token_data.get("open_id", f"tt_{uuid.uuid4().hex[:12]}")
                return data

        raise ValueError(f"Provider {provider} user info unsupported")
    
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
            
        elif provider == "instagram":
            email = user_info.get("email")
            # Facebook Graph API returns 'name', not 'username'
            name = user_info.get("name") or user_info.get("username", "")
            provider_id = user_info.get("id")

        elif provider == "facebook":
            email = user_info.get("email")
            name = user_info.get("name", "")
            provider_id = user_info.get("id")
            
        elif provider == "tiktok":
            # TikTok doesn't provide email by default
            email = f"user_{user_info.get('open_id', uuid.uuid4().hex[:8])}@tiktok.com"
            name = user_info.get("display_name", "")
            provider_id = user_info.get("open_id")
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        if not email:
            email = f"{provider}_{provider_id or uuid.uuid4().hex[:8]}@social.local"

        # Check if user exists
        user = db.query(User).filter(
            User.email == email
        ).first()
        
        if user:
            # Update existing user
            if name:
                user.full_name = name
            
        else:
            # Create new user
            user = User(
                email=email,
                full_name=name or provider.title(),
                hashed_password=get_password_hash(uuid.uuid4().hex),
                is_active=True,
                is_superuser=False,
                is_tenant_admin=True,
            )
            
            db.add(user)
        
        db.commit()
        db.refresh(user)

        if not user.is_superuser and not user.tenant_id:
            inferred_company = f"{(name or provider.title()).strip()} Workspace"
            ensure_user_tenant_context(db, user, company_name=inferred_company)
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
                "provider": "facebook",
                "name": "Facebook",
                "available": bool(self.providers["facebook"]["client_id"]),
                "icon": "facebook",
                "color": "#1877F2"
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
