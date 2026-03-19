#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release unzip

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi
chmod a+r /etc/apt/keyrings/docker.gpg

ARCH=$(dpkg --print-architecture)
CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
echo   "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable"   > /etc/apt/sources.list.d/docker.list

curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -

apt-get update
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin \
  nodejs

systemctl enable docker
systemctl start docker

npm install -g @fleetbase/cli
mkdir -p /opt/afruheritage/tenants

cat <<'DONE'
Runner bootstrap complete.
Validate with:
  docker --version
  docker compose version
  node --version
  npm --version
  flb --help
DONE
