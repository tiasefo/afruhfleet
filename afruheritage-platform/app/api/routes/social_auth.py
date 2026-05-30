from __future__ import annotations
from app.core.config import settings
from app.api.deps import get_current_user

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.social_auth_service import get_social_auth_service

logger = get_logger("afruheritage.social_auth_api")

router = APIRouter(prefix="/auth/social", tags=["Social Authentication"])


@router.get("/providers")
async def get_supported_providers():
    """Get list of supported social authentication providers"""
    try:
        social_service = get_social_auth_service()
        providers = social_service.get_supported_providers()
        
        return {
            "providers": providers,
            "base_url": settings.base_url
        }
        
    except Exception as e:
        logger.error("Failed to get supported providers", extra={"error": str(e)})
        raise HTTPException(
            status_code=500,
            detail="Failed to get supported providers"
        )


@router.get("/{provider}/login")
async def social_login(
    provider: str,
    request: Request,
):
    """Initiate social login with specified provider"""
    try:
        social_service = get_social_auth_service()
        
        # Get authorization URL
        auth_data = await social_service.get_authorization_url(provider, request)
        
        # Redirect to provider
        return RedirectResponse(url=auth_data["authorization_url"])
        
    except ValueError as e:
        logger.warning("Unsupported provider", extra={"provider": provider, "error": str(e)})
        raise HTTPException(
            status_code=400,
            detail=f"Provider {provider} not supported"
        )
    except Exception as e:
        logger.error("Social login initiation failed", extra={
            "provider": provider,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate {provider} login"
        )


@router.get("/{provider}")
async def social_login_url(provider: str, request: Request):
    """Return authorization URL for frontend-driven redirects."""
    try:
        social_service = get_social_auth_service()
        return await social_service.get_authorization_url(provider, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to get social auth URL", extra={"provider": provider, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to initialize {provider} login")


@router.get("/{provider}/callback")
async def social_callback(
    provider: str,
    request: Request,
    code: str | None = Query(None),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Handle social authentication callback"""
    try:
        if error:
            detail = error_description or error
            raise HTTPException(
                status_code=400,
                detail=f"{provider} authorization failed: {detail}",
            )

        if not code:
            raise HTTPException(
                status_code=400,
                detail=f"Missing authorization code for {provider} callback",
            )

        social_service = get_social_auth_service()
        
        # Process callback and create/update user
        result = await social_service.handle_callback(provider, code, request, db)
        
        logger.info("Social authentication successful", extra={
            "provider": provider,
            "user_id": result["user"].id
        })
        
        frontend_base = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3200"
        redirect_url = f"{frontend_base.rstrip('/')}/login?social_token={result['access_token']}&provider={provider}"
        return RedirectResponse(url=redirect_url)
        
    except ValueError as e:
        logger.error("Social authentication failed", extra={
            "provider": provider,
            "error": str(e)
        })
        raise HTTPException(
            status_code=400,
            detail=f"Social authentication failed: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Social callback processing failed", extra={
            "provider": provider,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process {provider} callback"
        )


@router.post("/{provider}/token")
async def exchange_code_for_token(
    provider: str,
    request: TokenExchangeRequest,
    db: Session = Depends(get_db),
):
    """Exchange authorization code for access token (alternative to callback)"""
    try:
        social_service = get_social_auth_service()
        
        # Process the code exchange
        result = await social_service.handle_callback(provider, request.code, request=None, db=db, redirect_uri=request.redirect_uri)
        
        return result
        
    except Exception as e:
        logger.error("Token exchange failed", extra={
            "provider": provider,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange token for {provider}"
        )


@router.get("/disconnect/{provider}")
async def disconnect_social_account(
    provider: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnect social account from user"""
    try:
        if not hasattr(current_user, 'social_accounts') or not current_user.social_accounts:
            raise HTTPException(
                status_code=400,
                detail="No social accounts connected"
            )
        
        if provider not in current_user.social_accounts:
            raise HTTPException(
                status_code=400,
                detail=f"No {provider} account connected"
            )
        
        # Remove social account
        del current_user.social_accounts[provider]
        db.commit()
        
        logger.info("Social account disconnected", extra={
            "user_id": str(current_user.id),
            "provider": provider
        })
        
        return {
            "message": f"{provider.title()} account disconnected successfully",
            "provider": provider
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to disconnect social account", extra={
            "user_id": str(current_user.id),
            "provider": provider,
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to disconnect {provider} account"
        )


@router.get("/connected")
async def get_connected_social_accounts(
    current_user: User = Depends(get_current_user),
):
    """Get list of connected social accounts"""
    try:
        connected_accounts = []
        
        if hasattr(current_user, 'social_accounts') and current_user.social_accounts:
            for provider, account_info in current_user.social_accounts.items():
                connected_accounts.append({
                    "provider": provider,
                    "provider_id": account_info.get("provider_id"),
                    "connected_at": account_info.get("created_at"),
                    "updated_at": account_info.get("updated_at")
                })
        
        return {
            "connected_accounts": connected_accounts,
            "total_connected": len(connected_accounts)
        }
        
    except Exception as e:
        logger.error("Failed to get connected accounts", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(
            status_code=500,
            detail="Failed to get connected accounts"
        )


# Request model for token exchange
from pydantic import BaseModel

class TokenExchangeRequest(BaseModel):
    code: str
    redirect_uri: str | None = None