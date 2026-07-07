"""DNS verification service — checks TXT, CNAME, and MX records via direct DNS lookups.

Used as a fallback when Cloudflare for SaaS is not configured. Generates the DNS
records a tenant needs to add, and verifies them by querying public DNS resolvers.
"""
from __future__ import annotations

import logging
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import datetime

import dns.resolver
import dns.exception

logger = logging.getLogger("afruheritage.dns_verification")

# Public DNS resolvers to query (Google, Cloudflare, OpenDNS) — improves reliability
DNS_RESOLVERS = ["8.8.8.8", "1.1.1.1", "208.67.222.222"]
DNS_TIMEOUT = 10  # seconds


@dataclass
class DNSRecord:
    """A single DNS record the tenant needs to add at their registrar."""
    record_type: str  # TXT, CNAME, MX, A
    name: str  # DNS name (host field at registrar)
    value: str  # DNS value (target/content at registrar)
    priority: int | None = None  # MX priority
    ttl: int = 3600
    purpose: str = ""  # human-readable explanation


@dataclass
class DNSInstructions:
    """Full set of DNS instructions for a custom domain."""
    hostname: str
    verification_token: str
    records: list[DNSRecord] = field(default_factory=list)
    instructions_text: str = ""
    provider_mode: str = "manual"  # "cloudflare" or "manual"


def generate_verification_token() -> str:
    """Generate a random verification token for domain ownership proof."""
    return f"afruheritage-verify={secrets.token_hex(16)}"


def build_dns_instructions(
    hostname: str,
    verification_token: str,
    platform_fallback: str,
    *,
    enable_email: bool = False,
    provider_mode: str = "manual",
) -> DNSInstructions:
    """Build the list of DNS records a tenant must add for their custom domain.

    Args:
        hostname: The custom domain (e.g., "acmeco.com")
        verification_token: The TXT verification string
        platform_fallback: The platform's hostname to CNAME to (e.g., "afruheritage.com")
        enable_email: If True, include MX records for email
        provider_mode: "cloudflare" or "manual"
    """
    records: list[DNSRecord] = []

    # 1. TXT record for ownership verification
    records.append(DNSRecord(
        record_type="TXT",
        name=f"_afruheritage-verify.{hostname}",
        value=verification_token,
        purpose="Proves you own this domain. Required before activation.",
    ))

    # 2. CNAME record for routing traffic to the platform
    # For apex domains, some registrars support ALIAS/ANAME instead of CNAME
    parts = hostname.split(".")
    is_apex = len(parts) <= 2
    if is_apex:
        records.append(DNSRecord(
            record_type="A",
            name=hostname,
            value="<platform-server-ip>",
            purpose="Points your apex domain to our server. If your registrar supports ALIAS/ANAME records, use that instead and point to " + platform_fallback,
        ))
    else:
        records.append(DNSRecord(
            record_type="CNAME",
            name=hostname,
            value=platform_fallback,
            purpose="Routes traffic for this subdomain to our platform.",
        ))

    # 3. MX records for email (optional)
    if enable_email:
        records.append(DNSRecord(
            record_type="MX",
            name=hostname,
            value="mail.afruheritage.com",
            priority=10,
            purpose="Allows you to receive email at your custom domain (e.g., info@{hostname}).",
        ))

    instructions = DNSInstructions(
        hostname=hostname,
        verification_token=verification_token,
        records=records,
        provider_mode=provider_mode,
    )
    instructions.instructions_text = _format_instructions_text(records, hostname)
    return instructions


def _format_instructions_text(records: list[DNSRecord], hostname: str) -> str:
    """Generate plain-text instructions for the tenant."""
    lines = [
        f"DNS Setup for {hostname}",
        "=" * 50,
        "",
        "Add the following DNS records at your domain registrar",
        "(GoDaddy, Namecheap, Cloudflare, etc.):",
        "",
    ]
    for r in records:
        lines.append(f"Type: {r.record_type}")
        lines.append(f"  Name/Host: {r.name}")
        lines.append(f"  Value/Target: {r.value}")
        if r.priority is not None:
            lines.append(f"  Priority: {r.priority}")
        lines.append(f"  TTL: {r.ttl}s (or default)")
        lines.append(f"  Purpose: {r.purpose}")
        lines.append("")
    lines.append("Once you've added these records, click 'Verify Now' to check.")
    lines.append("DNS propagation typically takes 5-60 minutes.")
    return "\n".join(lines)


def _get_resolver() -> dns.resolver.Resolver:
    """Create a DNS resolver configured with public DNS servers."""
    resolver = dns.resolver.Resolver()
    resolver.nameservers = DNS_RESOLVERS
    resolver.timeout = DNS_TIMEOUT
    resolver.lifetime = DNS_TIMEOUT
    return resolver


def check_txt_record(name: str, expected_value: str) -> bool:
    """Check if a TXT record exists with the expected value."""
    resolver = _get_resolver()
    try:
        answers = resolver.resolve(name, "TXT")
        for rdata in answers:
            txt_value = str(rdata).strip('"')
            if expected_value in txt_value:
                return True
        return False
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout):
        return False
    except Exception as exc:
        logger.warning("TXT lookup failed for %s: %s", name, exc)
        return False


def check_cname_record(name: str, expected_target: str) -> bool:
    """Check if a CNAME record exists pointing to the expected target."""
    resolver = _get_resolver()
    try:
        answers = resolver.resolve(name, "CNAME")
        for rdata in answers:
            target = str(rdata).rstrip(".")
            if expected_target.lower() in target.lower():
                return True
        return False
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout):
        return False
    except Exception as exc:
        logger.warning("CNAME lookup failed for %s: %s", name, exc)
        return False


def check_mx_record(name: str, expected_target: str) -> bool:
    """Check if an MX record exists pointing to the expected target."""
    resolver = _get_resolver()
    try:
        answers = resolver.resolve(name, "MX")
        for rdata in answers:
            target = str(rdata.exchange).rstrip(".")
            if expected_target.lower() in target.lower():
                return True
        return False
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout):
        return False
    except Exception as exc:
        logger.warning("MX lookup failed for %s: %s", name, exc)
        return False


def verify_domain_dns(
    hostname: str,
    verification_token: str,
    platform_fallback: str,
    *,
    check_email: bool = False,
) -> dict:
    """Verify a domain's DNS records.

    Returns a dict with:
        - txt_verified: bool
        - cname_verified: bool
        - mx_verified: bool | None (None if not checked)
        - all_verified: bool
        - details: dict with per-record status
    """
    txt_name = f"_afruheritage-verify.{hostname}"
    txt_verified = check_txt_record(txt_name, verification_token)

    parts = hostname.split(".")
    is_apex = len(parts) <= 2
    if is_apex:
        # For apex domains, we can't easily verify A records without knowing the server IP
        # Just check if the domain resolves at all
        cname_verified = _check_domain_resolves(hostname)
    else:
        cname_verified = check_cname_record(hostname, platform_fallback)

    mx_verified = None
    if check_email:
        mx_verified = check_mx_record(hostname, "mail.afruheritage.com")

    all_verified = txt_verified and cname_verified and (mx_verified is None or mx_verified)

    return {
        "txt_verified": txt_verified,
        "cname_verified": cname_verified,
        "mx_verified": mx_verified,
        "all_verified": all_verified,
        "details": {
            "txt": {
                "name": txt_name,
                "expected": verification_token,
                "found": txt_verified,
            },
            "cname": {
                "name": hostname,
                "expected": platform_fallback,
                "found": cname_verified,
            },
            "mx": {
                "name": hostname,
                "expected": "mail.afruheritage.com",
                "found": mx_verified,
            } if check_email else None,
        },
    }


def _check_domain_resolves(hostname: str) -> bool:
    """Check if a hostname resolves to any A record."""
    resolver = _get_resolver()
    try:
        resolver.resolve(hostname, "A")
        return True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout):
        return False
    except Exception:
        return False
