# Phase 1B Blueprint
Core components:
- runner_nodes
- tenant_runtimes
- runtime_events
- deploy_jobs
- deploy_job_logs

Install flow:
1. Receive provisioning request
2. Select runner
3. Prepare workspace
4. Create runtime/container configuration
5. Install Fleetbase via controlled wrapper
6. Attach Afruheritage extensions
7. Attach AI/Ollama integration
8. Configure domain target
9. Run health checks
10. Mark runtime active
