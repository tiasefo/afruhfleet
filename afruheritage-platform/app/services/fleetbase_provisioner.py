import logging
import posixpath
import shlex
from dataclasses import dataclass

import paramiko

from app.core.config import settings
from app.models.runner import RunnerNode
from app.models.tenant import DomainType, Tenant

logger = logging.getLogger(__name__)

# Maximum bytes read from a single SSH stream (guards against unbounded reads)
_STREAM_MAX_BYTES = 65536


@dataclass
class ProvisionResult:
    install_path: str
    console_url: str
    api_url: str
    detail: str
    log_excerpt: str


class FleetbaseProvisioner:
    def __init__(self, runner: RunnerNode):
        self.runner = runner

    def provision(self, tenant: Tenant) -> ProvisionResult:
        install_path = posixpath.join(self.runner.fleetbase_root, tenant.slug)
        console_url = self._build_console_url(tenant)
        api_url = self._build_api_url(tenant)

        logger.info(
            'tenant_id=%s runner_id=%s install_path=%s Starting Fleetbase provisioning',
            tenant.id,
            self.runner.id,
            install_path,
        )

        commands = [
            'set -euo pipefail',
            f'mkdir -p {shlex.quote(install_path)}',
            f'cd {shlex.quote(install_path)}',
            'export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"',
            f'flb install-fleetbase --host {shlex.quote(settings.fleetbase_default_install_host)} '
            f'--environment {shlex.quote(settings.fleetbase_install_environment)} '
            f'--directory {shlex.quote(install_path)}',
            f"printf '%s\n' '{tenant.company_name}' > {shlex.quote(posixpath.join(install_path, 'TENANT_NAME'))}",
            f"printf '%s\n' '{console_url}' > {shlex.quote(posixpath.join(install_path, 'AFRUHERITAGE_CONSOLE_URL'))}",
            f"printf '%s\n' '{api_url}' > {shlex.quote(posixpath.join(install_path, 'AFRUHERITAGE_API_URL'))}",
        ]
        log_excerpt = self._execute(commands, tenant_id=str(tenant.id))

        logger.info(
            'tenant_id=%s runner_id=%s Fleetbase provisioning completed',
            tenant.id,
            self.runner.id,
        )

        return ProvisionResult(
            install_path=install_path,
            console_url=console_url,
            api_url=api_url,
            detail='Fleetbase installation completed via official CLI on dedicated runner node.',
            log_excerpt=log_excerpt,
        )

    def _build_console_url(self, tenant: Tenant) -> str:
        if tenant.domain_type == DomainType.customer_domain:
            return f'https://{tenant.requested_domain}'
        return f'https://{tenant.slug}.{settings.default_subdomain_base}'

    def _build_api_url(self, tenant: Tenant) -> str:
        if tenant.domain_type == DomainType.customer_domain:
            return f'https://api.{tenant.requested_domain}'
        return f'https://api-{tenant.slug}.{settings.default_subdomain_base}'

    def _execute(self, commands: list[str], tenant_id: str = '') -> str:
        """Execute commands on the runner via SSH and return a bounded log excerpt."""
        script = ' && '.join(commands)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=self.runner.host,
            port=self.runner.ssh_port,
            username=self.runner.ssh_user,
            key_filename=settings.runner_default_ssh_key_path,
            timeout=30,
            banner_timeout=30,
        )
        try:
            _stdin, stdout, stderr = client.exec_command(script, timeout=settings.provisioning_timeout_seconds)
            exit_status = stdout.channel.recv_exit_status()
            stdout_text = stdout.read(_STREAM_MAX_BYTES).decode(errors='replace')
            stderr_text = stderr.read(_STREAM_MAX_BYTES).decode(errors='replace')

            combined = f'STDOUT:\n{stdout_text}\nSTDERR:\n{stderr_text}'.strip()

            if exit_status != 0:
                logger.error(
                    'tenant_id=%s runner=%s SSH command failed (exit=%d): %s',
                    tenant_id,
                    self.runner.host,
                    exit_status,
                    stderr_text[:500],
                )
                raise RuntimeError(
                    stderr_text or f'Fleetbase provisioning failed on runner node (exit {exit_status}).'
                )

            return combined[:_STREAM_MAX_BYTES]
        finally:
            client.close()
