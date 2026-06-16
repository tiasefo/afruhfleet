#!/bin/bash

OUTPUT_DIR="./sentinel_discovery"
mkdir -p "$OUTPUT_DIR"

echo "=== Sentinel Auto-Discovery Started (sudo mode) ==="

# REAL APPS ONLY — filter out system noise
APP_FILTER="fleetbase|susukredit|vault|speakup|server|ssdc|fineract|redis|postgres|wazuh|minio|n8n|authentik|netbox"

# Detect apps from docker
DOCKER_APPS=$(sudo docker ps --format '{{.Names}}' 2>/dev/null | cut -d'_' -f1 | sort -u | grep -E "$APP_FILTER")

# Detect apps from systemd
SYSTEMD_APPS=$(systemctl list-units --type=service --no-pager --no-legend \
    | awk '{print $1}' | cut -d'.' -f1 | grep -E "$APP_FILTER" | sort -u)

# Detect apps from /opt
DIR_APPS=$(ls /opt 2>/dev/null | grep -E "$APP_FILTER" | sort -u)

# Merge all
APPS=$(printf "%s\n%s\n%s\n" "$DOCKER_APPS" "$SYSTEMD_APPS" "$DIR_APPS" | sort -u)

echo "Detected applications:"
echo "$APPS"
echo

for APP in $APPS; do
    FILE="$OUTPUT_DIR/${APP}.json"
    echo "Processing app: $APP"

    HOSTNAME=$(hostname)
    IP=$(hostname -I | awk '{print $1}')

    # Docker components
    DOCKER_COMPONENTS=$(sudo docker ps --format '{{.Names}}' 2>/dev/null \
        | grep "$APP" | jq -R -s -c 'split("\n")[:-1]')

    # Systemd components
    SYSTEMD_COMPONENTS=$(systemctl list-units --type=service --no-pager --no-legend \
        | grep "$APP" | awk '{print $1}' | jq -R -s -c 'split("\n")[:-1]')

    # Ports
    PORTS=$(sudo ss -tulnp 2>/dev/null | grep "$APP" \
        | awk '{print $5}' | cut -d':' -f2 | jq -R -s -c 'split("\n")[:-1]')

    # Environment variables (docker only)
    ENV_VARS=$(sudo docker inspect "$APP" 2>/dev/null | jq '.[0].Config.Env' 2>/dev/null)

    # Volumes
    VOLUMES=$(sudo docker inspect "$APP" 2>/dev/null \
        | jq '.[0].Mounts[].Source' 2>/dev/null | jq -R -s -c 'split("\n")[:-1]')

    # Databases (global)
    DATABASES=$(sudo docker ps --format '{{.Names}}' \
        | grep -E 'postgres|mysql|redis|mongo' | jq -R -s -c 'split("\n")[:-1]')

    # Build JSON
    cat <<EOF > "$FILE"
{
  "app": "$APP",
  "host": "$HOSTNAME",
  "ip": "$IP",
  "docker_components": $DOCKER_COMPONENTS,
  "systemd_components": $SYSTEMD_COMPONENTS,
  "ports": $PORTS,
  "env_vars": $ENV_VARS,
  "volumes": $VOLUMES,
  "databases": $DATABASES
}
EOF

    echo " → Output written to $FILE"
    echo
done

echo "=== Sentinel Auto-Discovery Complete ==="
echo "Results stored in: $OUTPUT_DIR/"
