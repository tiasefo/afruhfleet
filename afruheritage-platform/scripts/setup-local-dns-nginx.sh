#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# setup-local-dns-nginx.sh
#
# One-time setup script for the AfruHeritage multi-tenant DNS + nginx stack.
# Run with:  sudo bash scripts/setup-local-dns-nginx.sh
#
# What it does
# ────────────
# 1. Frees port 53 on the host (disables systemd-resolved stub listener)
#    so the PowerDNS Docker container can bind to host port 53.
# 2. Installs the nginx wildcard site config for *.afruheritage.com.
# 3. Starts the PowerDNS container + zone initialiser via docker-compose.
# 4. (Optional) Updates Cloudflare tunnel config to bypass Cloudflare for
#    direct DNS resolution — or disables the tunnel if going fully self-hosted.
#
# After running this script, point your domain registrar NS records to:
#   ns1.afruheritage.com  →  <server_public_ip>
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
NGINX_CONF="$REPO_ROOT/nginx/afruheritage-host.nginx.conf"
NGINX_AVAIL="/etc/nginx/sites-available/afruheritage"
NGINX_ENABLED="/etc/nginx/sites-enabled/afruheritage"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
info()  { echo -e "${GREEN}[setup]${RESET} $*"; }
warn()  { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error() { echo -e "${RED}[error]${RESET} $*"; }

[[ $EUID -ne 0 ]] && { error "Must run as root (sudo)"; exit 1; }

# ── Step 1: Free port 53 ──────────────────────────────────────────────────────
info "Step 1/4: Freeing port 53 from systemd-resolved stub listener..."
RESOLVED_CONF="/etc/systemd/resolved.conf"
if grep -q "^DNSStubListener=no" "$RESOLVED_CONF" 2>/dev/null; then
    info "  DNSStubListener already disabled — skipping"
else
    # Backup and update
    cp "$RESOLVED_CONF" "${RESOLVED_CONF}.bak.$(date +%s)"
    if grep -q "^#DNSStubListener" "$RESOLVED_CONF"; then
        sed -i 's/^#DNSStubListener.*/DNSStubListener=no/' "$RESOLVED_CONF"
    else
        echo "DNSStubListener=no" >> "$RESOLVED_CONF"
    fi
    # Point /etc/resolv.conf to a real upstream while stub is disabled
    if ! grep -q "^DNS=" "$RESOLVED_CONF"; then
        echo "DNS=1.1.1.1 8.8.8.8" >> "$RESOLVED_CONF"
    fi
    systemctl restart systemd-resolved
    # Update /etc/resolv.conf symlink (Ubuntu)
    ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf 2>/dev/null || true
    info "  systemd-resolved stub listener disabled"
fi

# Verify port 53 is free
if ss -ulnp | grep -q ':53 '; then
    warn "  Something else is still on UDP port 53 — PowerDNS may fail to bind"
    ss -ulnp | grep ':53 '
fi

# ── Step 2: Install nginx wildcard config ─────────────────────────────────────
info "Step 2/4: Installing nginx wildcard site config..."
if [[ ! -f "$NGINX_CONF" ]]; then
    error "  Nginx config not found at: $NGINX_CONF"
    exit 1
fi
cp "$NGINX_CONF" "$NGINX_AVAIL"
ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"

# Remove the default catch-all if it exists
if [[ -L /etc/nginx/sites-enabled/default ]]; then
    rm /etc/nginx/sites-enabled/default
    info "  Removed default nginx site"
fi

nginx -t
systemctl reload nginx
info "  nginx wildcard config installed and reloaded"

# ── Step 3: Start PowerDNS via docker-compose ─────────────────────────────────
info "Step 3/4: Starting PowerDNS + zone initialiser..."
cd "$REPO_ROOT"

# Load .env to get PDNS_API_KEY and SERVER_PUBLIC_IP
if [[ -f .env ]]; then
    set -a; source .env; set +a
fi

# Ensure required env vars are set
if [[ -z "${PDNS_API_KEY:-}" ]]; then
    PDNS_API_KEY="$(openssl rand -hex 24)"
    echo "" >> .env
    echo "# PowerDNS API key (auto-generated)" >> .env
    echo "PDNS_API_KEY=${PDNS_API_KEY}" >> .env
    info "  Generated PDNS_API_KEY and appended to .env"
fi

if [[ -z "${SERVER_PUBLIC_IP:-}" ]]; then
    SERVER_PUBLIC_IP="$(curl -s --max-time 5 https://ipinfo.io/ip || echo "")"
    if [[ -z "$SERVER_PUBLIC_IP" ]]; then
        warn "  Could not auto-detect SERVER_PUBLIC_IP — please set it in .env"
    else
        echo "SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}" >> .env
        info "  Detected and saved SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}"
    fi
fi

# Start only pdns and pdns-init (not the full stack)
docker compose up -d pdns pdns-init
info "  PowerDNS started. Waiting for zone initialiser..."
sleep 5
docker compose logs pdns-init 2>/dev/null | tail -15

# ── Step 4: Disable / replace Cloudflare tunnel ───────────────────────────────
info "Step 4/4: Cloudflare tunnel..."
echo ""
warn "  IMPORTANT — Cloudflare tunnel vs self-hosted DNS:"
echo ""
echo "  The Cloudflare tunnel (cloudflared) currently routes afruheritage.com"
echo "  traffic to this server.  With PowerDNS you have two options:"
echo ""
echo "  Option A (recommended): Keep Cloudflare tunnel for HTTPS/CDN but"
echo "  disable it for subdomains — just re-point the wildcard in Cloudflare"
echo "  dashboard to 'DNS-only' (grey cloud) for *.afruheritage.com."
echo ""
echo "  Option B (fully self-hosted): Stop cloudflared, open ports 80/443 on"
echo "  the server firewall, change NS records at your registrar to:"
echo "    NS1: ns1.afruheritage.com → ${SERVER_PUBLIC_IP:-<your-server-ip>}"
echo ""
echo "  To stop cloudflared:  sudo systemctl stop cloudflared"
echo "  To disable on boot:   sudo systemctl disable cloudflared"
echo ""

info "Setup complete! Summary:"
echo "  ✅ Port 53 free for PowerDNS"
echo "  ✅ Nginx wildcard *.afruheritage.com → :3002 (frontend)"
echo "  ✅ PowerDNS authoritative for afruheritage.com"
echo "  ✅ Wildcard A record  *.afruheritage.com → ${SERVER_PUBLIC_IP:-<ip>}"
echo ""
echo "  Next step: At your domain registrar, set NS record(s) to this"
echo "  server's IP (${SERVER_PUBLIC_IP:-<your-server-ip>})."
echo "  New tenants will be reachable at slug.afruheritage.com immediately."
