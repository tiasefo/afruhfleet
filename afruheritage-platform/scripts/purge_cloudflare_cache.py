#!/usr/bin/env python3
"""Quick script to purge Cloudflare cache for afruheritage.com"""
import os
import sys
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.cloudflare_domains import _get_client

def main():
    client = _get_client()
    if not client.enabled():
        print("ERROR: Cloudflare API token or zone ID not set in environment")
        print("Required: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID")
        sys.exit(1)

    print("Purging Cloudflare cache for afruheritage.com...")
    try:
        # Purge specific URLs
        urls = [
            "https://afruheritage.com/",
            "https://afruheritage.com",
            "https://www.afruheritage.com/",
            "https://www.afruheritage.com",
        ]
        result = client.purge_cache(urls=urls)
        if result.get("success"):
            print("✓ Specific URLs purged successfully")
            print(f"Response: {result}")
        else:
            print(f"✗ Failed to purge URLs: {result}")
            sys.exit(1)
    except Exception as e:
        print(f"✗ Error purging cache: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
