from __future__ import annotations

import logging
import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

logger = logging.getLogger("afruheritage.storage")


class StorageProvider(ABC):
    @abstractmethod
    def upload(self, tenant_id: str, path: str, data: BinaryIO, content_type: str = "application/octet-stream") -> str:
        """Upload file, return public URL or storage key."""
        ...

    @abstractmethod
    def download(self, tenant_id: str, path: str) -> bytes | None:
        """Download file contents."""
        ...

    @abstractmethod
    def delete(self, tenant_id: str, path: str) -> bool:
        """Delete file, return True if deleted."""
        ...

    @abstractmethod
    def list_files(self, tenant_id: str, prefix: str = "") -> list[str]:
        """List file paths under prefix for tenant."""
        ...

    @abstractmethod
    def get_url(self, tenant_id: str, path: str) -> str | None:
        """Get public/signed URL for a file."""
        ...


class LocalStorageProvider(StorageProvider):
    """File-system storage — suitable for development and single-node deployments."""

    def __init__(self, base_dir: str = "/srv/afruheritage/storage"):
        self.base_dir = Path(base_dir)

    def _tenant_dir(self, tenant_id: str) -> Path:
        d = self.base_dir / tenant_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def upload(self, tenant_id: str, path: str, data: BinaryIO, content_type: str = "application/octet-stream") -> str:
        full_path = self._tenant_dir(tenant_id) / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "wb") as f:
            shutil.copyfileobj(data, f)
        logger.info("Stored file %s for tenant %s", path, tenant_id)
        return f"/storage/{tenant_id}/{path}"

    def download(self, tenant_id: str, path: str) -> bytes | None:
        full_path = self._tenant_dir(tenant_id) / path
        if not full_path.exists():
            return None
        return full_path.read_bytes()

    def delete(self, tenant_id: str, path: str) -> bool:
        full_path = self._tenant_dir(tenant_id) / path
        if full_path.exists():
            full_path.unlink()
            logger.info("Deleted file %s for tenant %s", path, tenant_id)
            return True
        return False

    def list_files(self, tenant_id: str, prefix: str = "") -> list[str]:
        base = self._tenant_dir(tenant_id)
        search_dir = base / prefix if prefix else base
        if not search_dir.exists():
            return []
        return [str(p.relative_to(base)) for p in search_dir.rglob("*") if p.is_file()]

    def get_url(self, tenant_id: str, path: str) -> str | None:
        full_path = self._tenant_dir(tenant_id) / path
        if full_path.exists():
            return f"/storage/{tenant_id}/{path}"
        return None


class S3StorageProvider(StorageProvider):
    """AWS S3 / S3-compatible (MinIO, DigitalOcean Spaces) storage."""

    def __init__(self, bucket: str, region: str = "us-east-1", endpoint_url: str | None = None):
        import boto3
        self.bucket = bucket
        session_kwargs: dict = {"region_name": region}
        client_kwargs: dict = {}
        if endpoint_url:
            client_kwargs["endpoint_url"] = endpoint_url
        self._s3 = boto3.client("s3", **session_kwargs, **client_kwargs)

    def _key(self, tenant_id: str, path: str) -> str:
        return f"tenants/{tenant_id}/{path}"

    def upload(self, tenant_id: str, path: str, data: BinaryIO, content_type: str = "application/octet-stream") -> str:
        key = self._key(tenant_id, path)
        self._s3.upload_fileobj(data, self.bucket, key, ExtraArgs={"ContentType": content_type})
        logger.info("S3 uploaded %s for tenant %s", key, tenant_id)
        return f"s3://{self.bucket}/{key}"

    def download(self, tenant_id: str, path: str) -> bytes | None:
        import io
        key = self._key(tenant_id, path)
        try:
            buf = io.BytesIO()
            self._s3.download_fileobj(self.bucket, key, buf)
            return buf.getvalue()
        except Exception:
            return None

    def delete(self, tenant_id: str, path: str) -> bool:
        key = self._key(tenant_id, path)
        try:
            self._s3.delete_object(Bucket=self.bucket, Key=key)
            logger.info("S3 deleted %s", key)
            return True
        except Exception:
            return False

    def list_files(self, tenant_id: str, prefix: str = "") -> list[str]:
        full_prefix = self._key(tenant_id, prefix)
        try:
            resp = self._s3.list_objects_v2(Bucket=self.bucket, Prefix=full_prefix)
            base = f"tenants/{tenant_id}/"
            return [obj["Key"].replace(base, "", 1) for obj in resp.get("Contents", [])]
        except Exception:
            return []

    def get_url(self, tenant_id: str, path: str) -> str | None:
        key = self._key(tenant_id, path)
        try:
            url = self._s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=3600,
            )
            return url
        except Exception:
            return None


class StorageService:
    def __init__(self, provider: StorageProvider | None = None):
        self._provider = provider or LocalStorageProvider()

    def upload(self, tenant_id: str, path: str, data: BinaryIO, content_type: str = "application/octet-stream") -> str:
        return self._provider.upload(tenant_id, path, data, content_type)

    def download(self, tenant_id: str, path: str) -> bytes | None:
        return self._provider.download(tenant_id, path)

    def delete(self, tenant_id: str, path: str) -> bool:
        return self._provider.delete(tenant_id, path)

    def list_files(self, tenant_id: str, prefix: str = "") -> list[str]:
        return self._provider.list_files(tenant_id, prefix)

    def get_url(self, tenant_id: str, path: str) -> str | None:
        return self._provider.get_url(tenant_id, path)


def get_storage_service() -> StorageService:
    from app.core.config import settings
    bucket = getattr(settings, "s3_bucket", "")
    if bucket:
        region = getattr(settings, "s3_region", "us-east-1")
        endpoint = getattr(settings, "s3_endpoint_url", None)
        return StorageService(S3StorageProvider(bucket, region, endpoint))
    storage_dir = getattr(settings, "local_storage_dir", "/srv/afruheritage/storage")
    return StorageService(LocalStorageProvider(storage_dir))


storage_service = get_storage_service()
