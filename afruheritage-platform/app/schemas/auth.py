from pydantic import BaseModel, EmailStr, Field


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    full_name: str = Field(min_length=2, max_length=255)


class LoginRequest(BaseModel):
    username: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
