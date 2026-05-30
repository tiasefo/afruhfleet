import posixpath
import shlex
from dataclasses import dataclass

import paramiko

from app.core.config import settings
from app.services.fleetbase_install_script import build_fleetbase_install_script
from app.models.runner import RunnerNode
from app.models.tenant import DomainType, Tenant


@dataclass
class ProvisionResult:
    install_path: str
    console_url: str
    api_url: str
    detail: str


class FleetbaseProvisioner:
    def __init__(self, runner: RunnerNode):
        self.runner = runner

    def provision(self, tenant: Tenant) -> ProvisionResult:
        install_path = posixpath.join(self.runner.fleetbase_root, tenant.slug)
        console_url = self._build_console_url(tenant)
        api_url = self._build_api_url(tenant)

        commands = [
            build_fleetbase_install_script(
                install_path=install_path,
                host=settings.fleetbase_default_install_host,
                environment=settings.fleetbase_install_environment,
            ),
            f"printf '%s\n' '{tenant.company_name}' > {shlex.quote(posixpath.join(install_path, 'TENANT_NAME'))}",
            f"printf '%s\n' '{console_url}' > {shlex.quote(posixpath.join(install_path, 'AFRUHERITAGE_CONSOLE_URL'))}",
            f"printf '%s\n' '{api_url}' > {shlex.quote(posixpath.join(install_path, 'AFRUHERITAGE_API_URL'))}",
        ]
        self._execute(commands)
        return ProvisionResult(
            install_path=install_path,
            console_url=console_url,
            api_url=api_url,
            detail='Fleetbase installation completed via deterministic install script on dedicated runner node.',
        )

    def _build_console_url(self, tenant: Tenant) -> str:
        if tenant.domain_type == DomainType.customer_domain:
            return f'https://{tenant.requested_domain}'
        return f'https://{tenant.slug}.{settings.default_subdomain_base}'

    def _build_api_url(self, tenant: Tenant) -> str:
        if tenant.domain_type == DomainType.customer_domain:
            return f'https://api.{tenant.requested_domain}'
        return f'https://api-{tenant.slug}.{settings.default_subdomain_base}'

    def _execute(self, commands: list[str], stdin_text: str | None = None) -> None:
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
            remote_command = f'bash -lc {shlex.quote(script)}'
            stdin, stdout, stderr = client.exec_command(
                remote_command,
                timeout=settings.provisioning_timeout_seconds,
                get_pty=stdin_text is not None,
            )
            if stdin_text:
                stdin.write(stdin_text)
                stdin.flush()
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                error_output = (stderr.read().decode() + stdout.read().decode()).strip()
                raise RuntimeError(error_output or 'Fleetbase provisioning failed on runner node.')
        finally:
            client.close()
