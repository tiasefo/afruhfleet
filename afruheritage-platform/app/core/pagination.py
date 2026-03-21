from __future__ import annotations

from typing import Any, Generic, Sequence, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int


def paginate(items: Sequence[Any], total: int, params: PaginationParams) -> PaginatedResponse:
    pages = max(1, (total + params.page_size - 1) // params.page_size)
    return PaginatedResponse(
        items=list(items),
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
    )
