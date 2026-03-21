#!/usr/bin/env bash
set -euo pipefail

echo "Installing runner prerequisites..."
sudo apt update
sudo apt install -y curl ca-certificates gnupg lsb-release openssh-server jq

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo mkdir -p /srv/afruheritage/tenants
sudo chown -R "$USER":"$USER" /srv/afruheritage

if ! command -v flb >/dev/null 2>&1; then
  sudo npm install -g @fleetbase/cli
fi

echo "Runner bootstrap complete."
echo "Verify:"
echo "  docker --version"
echo "  node --version"
echo "  npm --version"
echo "  flb --version"
