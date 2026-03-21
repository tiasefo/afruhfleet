from __future__ import annotations

import os
import shlex
import subprocess
from pathlib import Path


class RunnerExecutor:
    def __init__(self, ssh_key_path: str | None = None) -> None:
        self.ssh_key_path = ssh_key_path or os.getenv(
            "RUNNER_DEFAULT_SSH_KEY_PATH",
            "/run/secrets/afruheritage_runner_key",
        )

    def _ssh_base(self, *, host: str, port: int, user: str) -> list[str]:
        cmd = [
            "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-i", self.ssh_key_path,
            "-p", str(port),
            f"{user}@{host}",
        ]
        return cmd

    def run_remote(self, *, host: str, port: int, user: str, command: str) -> tuple[int, str, str]:
        full_cmd = self._ssh_base(host=host, port=port, user=user) + [command]
        proc = subprocess.run(full_cmd, capture_output=True, text=True)
        return proc.returncode, proc.stdout, proc.stderr

    def run_local(self, command: str, cwd: str | None = None) -> tuple[int, str, str]:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
        )
        return proc.returncode, proc.stdout, proc.stderr

    def ensure_remote_dir(self, *, host: str, port: int, user: str, path: str) -> tuple[int, str, str]:
        cmd = f"mkdir -p {shlex.quote(path)}"
        return self.run_remote(host=host, port=port, user=user, command=cmd)
