from pydantic import BaseModel, Field


class RunnerCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    host: str = Field(min_length=3, max_length=255)
    ssh_port: int = 22
    ssh_user: str = Field(min_length=1, max_length=120)
    fleetbase_root: str = Field(min_length=3, max_length=255)
    reserved_for_single_tenant: bool = True


class RunnerResponse(BaseModel):
    id: str
    name: str
    host: str
    ssh_port: int
    ssh_user: str
    fleetbase_root: str
    is_active: bool
    reserved_for_single_tenant: bool

    class Config:
        from_attributes = True
