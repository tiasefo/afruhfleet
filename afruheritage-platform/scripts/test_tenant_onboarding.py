import requests

API_URL = "http://localhost:8100/api/v1"
ADMIN_TOKEN = "<YOUR_ADMIN_TOKEN>"  # Replace with a real admin JWT

headers = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json",
}

def create_tenant():
    payload = {
        "company_name": "Blue Atlas Freight",
        "contact_email": "ops@blueatlas.example",
        "plan_code": "growth",
        "requested_domain": "blueatlas.afruheritage.example.com",
        "domain_type": "provider_subdomain",
        "verification_notes": "KYC docs validated manually by operations"
    }
    resp = requests.post(f"{API_URL}/tenants", json=payload, headers=headers)
    print("Create tenant:", resp.status_code, resp.json())
    return resp.json()["id"]

def approve_tenant(tenant_id):
    payload = {"verification_notes": "Approved for provisioning"}
    resp = requests.post(f"{API_URL}/tenants/{tenant_id}/approve", json=payload, headers=headers)
    print("Approve tenant:", resp.status_code, resp.json())

def launch_tenant(tenant_id, runner_id):
    payload = {"runner_id": runner_id}
    resp = requests.post(f"{API_URL}/tenants/{tenant_id}/launch", json=payload, headers=headers)
    print("Launch tenant:", resp.status_code, resp.json())
    return resp.json()["id"]

def get_job(job_id):
    resp = requests.get(f"{API_URL}/tenants/jobs/{job_id}", headers=headers)
    print("Job status:", resp.status_code, resp.json())

def main():
    tenant_id = create_tenant()
    approve_tenant(tenant_id)
    runner_id = "<YOUR_RUNNER_ID>"  # Replace with a real runner ID
    job_id = launch_tenant(tenant_id, runner_id)
    get_job(job_id)

if __name__ == "__main__":
    main()
