from __future__ import annotations

import base64
import os
import posixpath
import shlex


INSTALL_MARKER_FILES = (
    "TENANT_NAME",
    "AFRUHERITAGE_CONSOLE_URL",
    "AFRUHERITAGE_API_URL",
    "AFRUHERITAGE_DATABASE_PORT",
    "AFRUHERITAGE_SOCKET_PORT",
    "AFRUHERITAGE_CONSOLE_PORT",
    "AFRUHERITAGE_HTTP_PORT",
)


def build_fleetbase_install_script(*, install_path: str, host: str, environment: str) -> str:
    app_key = "base64:" + base64.b64encode(os.urandom(32)).decode("ascii")
    use_https = environment == "production"
    app_debug = "false" if use_https else "true"
    scheme = "https" if use_https else "http"
    socketcluster_secure = "true" if use_https else "false"
    marker_paths = " ".join(
        shlex.quote(posixpath.join(install_path, marker_file)) for marker_file in INSTALL_MARKER_FILES
    )

    docker_override = "\n".join(
        [
            "services:",
            "  application:",
            "    environment:",
            f'      APP_KEY: "{app_key}"',
            f'      CONSOLE_HOST: "{scheme}://{host}:__AFRU_CONSOLE_PORT__"',
            f'      ENVIRONMENT: "{environment}"',
            f'      APP_DEBUG: "{app_debug}"',
            "",
        ]
    )
    config_json = "\n".join(
        [
            "{",
            f'  "API_HOST": "{scheme}://{host}:__AFRU_HTTP_PORT__",',
            f'  "SOCKETCLUSTER_HOST": "{host}",',
            '  "SOCKETCLUSTER_PORT": "__AFRU_SOCKET_PORT__",',
            f'  "SOCKETCLUSTER_SECURE": {socketcluster_secure}',
            "}",
        ]
    )
    config_json_with_newline = config_json + "\n"
    console_env_development = "\n".join(
        [
            f"API_HOST=http://{host}:__AFRU_HTTP_PORT__",
            "API_NAMESPACE=int/v1",
            "SOCKETCLUSTER_PATH=/socketcluster/",
            f"SOCKETCLUSTER_HOST={host}",
            "SOCKETCLUSTER_SECURE=false",
            "SOCKETCLUSTER_PORT=__AFRU_SOCKET_PORT__",
            "OSRM_HOST=https://router.project-osrm.org",
            "",
        ]
    )
    console_env_production = "\n".join(
        [
            f"API_HOST=https://{host}:__AFRU_HTTP_PORT__",
            "API_NAMESPACE=int/v1",
            "API_SECURE=true",
            "SOCKETCLUSTER_PATH=/socketcluster/",
            f"SOCKETCLUSTER_HOST={host}",
            "SOCKETCLUSTER_SECURE=true",
            "SOCKETCLUSTER_PORT=__AFRU_SOCKET_PORT__",
            "OSRM_HOST=https://router.project-osrm.org",
            "",
        ]
    )

    return "\n".join(
        [
            "set -euo pipefail",
            f"mkdir -p {shlex.quote(install_path)}",
            f"cd {shlex.quote(install_path)}",
            'export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"',
            f'if [ ! -f docker-compose.yml ]; then rm -f {marker_paths}; fi',
            "command -v git >/dev/null 2>&1",
            "command -v docker >/dev/null 2>&1",
            "command -v bash >/dev/null 2>&1",
            "pick_port() {",
            "  start=\"$1\"",
            "  end=\"$2\"",
            "  port=\"$start\"",
            "  while [ \"$port\" -le \"$end\" ]; do",
            "    if ! ss -H -ltn \"sport = :$port\" | grep -q .; then",
            "      echo \"$port\"",
            "      return 0",
            "    fi",
            "    port=$((port + 1))",
            "  done",
            "  echo \"No free port available in range $start-$end\" >&2",
            "  return 1",
            "}",
            "if [ ! -f docker-compose.yml ]; then",
            "  if find . -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then",
            "    echo 'Install directory is not empty and does not contain docker-compose.yml' >&2",
            "    exit 1",
            "  fi",
            "  AFRU_DB_PORT=$(pick_port 3306 3399)",
            "  AFRU_SOCKET_PORT=$(pick_port 38000 38999)",
            "  AFRU_CONSOLE_PORT=$(pick_port 4200 4299)",
            "  AFRU_HTTP_PORT=$(pick_port 8000 8099)",
            "  export AFRU_DB_PORT AFRU_SOCKET_PORT AFRU_CONSOLE_PORT AFRU_HTTP_PORT",
            "  git clone https://github.com/fleetbase/fleetbase.git .",
            "else",
            "  if [ -f .afruheritage-runtime.env ]; then",
            "    set -a",
            "    . ./.afruheritage-runtime.env",
            "    set +a",
            "  else",
            "    AFRU_DB_PORT=$(pick_port 3306 3399)",
            "    AFRU_SOCKET_PORT=$(pick_port 38000 38999)",
            "    AFRU_CONSOLE_PORT=$(pick_port 4200 4299)",
            "    AFRU_HTTP_PORT=$(pick_port 8000 8099)",
            "    export AFRU_DB_PORT AFRU_SOCKET_PORT AFRU_CONSOLE_PORT AFRU_HTTP_PORT",
            "  fi",
            "fi",
            "perl -0pi -e 's/\"3306:3306\"/\"$ENV{AFRU_DB_PORT}:3306\"/g; s/\"38000:8000\"/\"$ENV{AFRU_SOCKET_PORT}:8000\"/g; s/\"4200:4200\"/\"$ENV{AFRU_CONSOLE_PORT}:4200\"/g; s/\"8000:80\"/\"$ENV{AFRU_HTTP_PORT}:80\"/g' docker-compose.yml",
            "mkdir -p console console/environments",
            "printf '%s\n' \"AFRU_DB_PORT=$AFRU_DB_PORT\" \"AFRU_SOCKET_PORT=$AFRU_SOCKET_PORT\" \"AFRU_CONSOLE_PORT=$AFRU_CONSOLE_PORT\" \"AFRU_HTTP_PORT=$AFRU_HTTP_PORT\" > .afruheritage-runtime.env",
            f"printf '%s' {shlex.quote(docker_override)} > docker-compose.override.yml",
            f"printf '%s' {shlex.quote(config_json_with_newline)} > console/fleetbase.config.json",
            f"printf '%s' {shlex.quote(console_env_development)} > console/environments/.env.development",
            f"printf '%s' {shlex.quote(console_env_production)} > console/environments/.env.production",
            "perl -0pi -e 's/__AFRU_CONSOLE_PORT__/$ENV{AFRU_CONSOLE_PORT}/g; s/__AFRU_HTTP_PORT__/$ENV{AFRU_HTTP_PORT}/g; s/__AFRU_SOCKET_PORT__/$ENV{AFRU_SOCKET_PORT}/g' docker-compose.override.yml console/fleetbase.config.json console/environments/.env.development console/environments/.env.production",
            "printf '%s\n' \"$AFRU_DB_PORT\" > AFRUHERITAGE_DATABASE_PORT",
            "printf '%s\n' \"$AFRU_SOCKET_PORT\" > AFRUHERITAGE_SOCKET_PORT",
            "printf '%s\n' \"$AFRU_CONSOLE_PORT\" > AFRUHERITAGE_CONSOLE_PORT",
            "printf '%s\n' \"$AFRU_HTTP_PORT\" > AFRUHERITAGE_HTTP_PORT",
            "docker compose --env-file .afruheritage-runtime.env up -d",
            "attempt=0",
            "until docker compose --env-file .afruheritage-runtime.env exec -T application bash -lc ':</dev/tcp/database/3306' >/dev/null 2>&1; do",
            "  attempt=$((attempt + 1))",
            "  if [ \"$attempt\" -ge 24 ]; then",
            "    echo 'Database did not become reachable from the application container in time' >&2",
            "    exit 1",
            "  fi",
            "  sleep 5",
            "done",
            "docker compose --env-file .afruheritage-runtime.env exec -T application bash -lc './deploy.sh'",
            "docker compose --env-file .afruheritage-runtime.env up -d",
            "test -f docker-compose.yml",
        ]
    )