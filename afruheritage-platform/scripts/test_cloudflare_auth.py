#!/usr/bin/env python3
"""Test Cloudflare API credentials"""
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

import httpx

def test_api_token():
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    if not api_token:
        print("❌ CLOUDFLARE_API_TOKEN not set")
        return False
    
    print(f"Testing API Token: {api_token[:20]}...")
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = httpx.get("https://api.cloudflare.com/client/v4/user/tokens/verify", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_global_api_key():
    api_key = os.getenv("CLOUDFLARE_API_KEY")
    api_email = os.getenv("CLOUDFLARE_API_EMAIL")
    
    if not api_key or not api_email:
        print("❌ CLOUDFLARE_API_KEY or CLOUDFLARE_API_EMAIL not set")
        return False
    
    print(f"Testing Global API Key: {api_key[:20]}...")
    print(f"Email: {api_email}")
    headers = {
        "X-Auth-Email": api_email,
        "X-Auth-Key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        resp = httpx.get("https://api.cloudflare.com/client/v4/user", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_zone_access():
    zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
    api_key = os.getenv("CLOUDFLARE_API_KEY")
    api_email = os.getenv("CLOUDFLARE_API_EMAIL")
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    
    if not zone_id:
        print("❌ CLOUDFLARE_ZONE_ID not set")
        return False
    
    print(f"Testing Zone Access: {zone_id}")
    
    # Try with API token first
    if api_token:
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        try:
            resp = httpx.get(f"https://api.cloudflare.com/client/v4/zones/{zone_id}", headers=headers)
            print(f"API Token Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            if resp.status_code == 200:
                return True
        except Exception as e:
            print(f"API Token Error: {e}")
    
    # Try with Global API key
    if api_key and api_email:
        headers = {
            "X-Auth-Email": api_email,
            "X-Auth-Key": api_key,
            "Content-Type": "application/json"
        }
        try:
            resp = httpx.get(f"https://api.cloudflare.com/client/v4/zones/{zone_id}", headers=headers)
            print(f"Global API Key Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            if resp.status_code == 200:
                return True
        except Exception as e:
            print(f"Global API Key Error: {e}")
    
    return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Cloudflare API Credentials")
    print("=" * 60)
    
    test_api_token()
    print()
    test_global_api_key()
    print()
    test_zone_access()
