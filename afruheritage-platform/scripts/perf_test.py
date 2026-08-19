#!/usr/bin/env python3
"""Afruheritage Performance Test — pure Python, no external deps."""
import urllib.request
import urllib.error
import concurrent.futures
import time
import statistics
import sys
import json
import os

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8100")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3002")
TENANT_SLUG = os.environ.get("TENANT_SLUG", "uat-test-tenant-uat-6")
CONCURRENT = int(os.environ.get("CONCURRENT", "10"))
REQUESTS_PER_ENDPOINT = int(os.environ.get("REQUESTS_PER_ENDPOINT", "100"))

ENDPOINTS = [
    ("Health", f"{API_URL}/health"),
    ("Tenant Context API", f"{API_URL}/api/v1/tenant-context/{TENANT_SLUG}"),
    ("Billing Plans", f"{API_URL}/api/v1/billing/plans"),
    ("Pricing Professional", f"{API_URL}/api/v1/billing/pricing/professional"),
    ("Storefront Page", f"{FRONTEND_URL}/store/{TENANT_SLUG}"),
    ("Frontend Home", f"{FRONTEND_URL}"),
]


def do_request(url, timeout=15):
    try:
        req = urllib.request.Request(url, method="GET")
        start = time.monotonic()
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            elapsed = time.monotonic() - start
            return elapsed, resp.status, None
    except urllib.error.HTTPError as e:
        elapsed = time.monotonic() - start
        return elapsed, e.code, str(e)
    except Exception as e:
        elapsed = time.monotonic() - start
        return elapsed, 0, str(e)


def test_endpoint(name, url, concurrent_users, total_requests):
    latencies = []
    errors = 0
    status_codes = {}

    def worker(_):
        lat, code, err = do_request(url)
        return lat, code, err

    start_time = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as pool:
        results = list(pool.map(worker, range(total_requests)))
    duration = time.monotonic() - start_time

    for lat, code, err in results:
        latencies.append(lat)
        status_codes[code] = status_codes.get(code, 0) + 1
        if code != 200:
            errors += 1

    latencies.sort()
    total = len(latencies)
    rps = total / duration if duration > 0 else 0
    median = statistics.median(latencies) * 1000
    p95 = latencies[int(total * 0.95)] * 1000 if total > 0 else 0
    p99 = latencies[int(total * 0.99)] * 1000 if total > 0 else 0
    error_rate = (errors / total * 100) if total > 0 else 0

    print(f"\n--- {name} ---")
    print(f"  URL: {url}")
    print(f"  Requests: {total} | Concurrency: {concurrent_users}")
    print(f"  Duration: {duration:.2f}s")
    print(f"  RPS: {rps:.1f}")
    print(f"  Error rate: {error_rate:.1f}% ({errors}/{total})")
    print(f"  Median: {median:.1f} ms")
    print(f"  p95: {p95:.1f} ms")
    print(f"  p99: {p99:.1f} ms")
    print(f"  Status codes: {status_codes}")

    return {
        "name": name,
        "url": url,
        "requests": total,
        "concurrency": concurrent_users,
        "duration_s": round(duration, 2),
        "rps": round(rps, 1),
        "error_rate_pct": round(error_rate, 1),
        "median_ms": round(median, 1),
        "p95_ms": round(p95, 1),
        "p99_ms": round(p99, 1),
        "status_codes": status_codes,
    }


def get_container_stats():
    try:
        import subprocess
        result = subprocess.run(
            ["docker", "stats", "--no-stream", "--format",
             "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}",
             "afruheritage-api", "afruheritage-postgres"],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip()
    except Exception as e:
        return f"Could not get container stats: {e}"


if __name__ == "__main__":
    print(f"=== Afruheritage Performance Test ===")
    print(f"Concurrent users: {CONCURRENT}")
    print(f"Requests per endpoint: {REQUESTS_PER_ENDPOINT}")
    print(f"API: {API_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print(f"Tenant slug: {TENANT_SLUG}")

    all_results = []
    for name, url in ENDPOINTS:
        r = test_endpoint(name, url, CONCURRENT, REQUESTS_PER_ENDPOINT)
        all_results.append(r)

    print("\n=== Container Resource Usage ===")
    stats = get_container_stats()
    print(stats)

    print("\n=== Summary ===")
    print(f"{'Endpoint':<25} {'RPS':>8} {'Errors':>7} {'Median':>10} {'p95':>10} {'p99':>10}")
    print("-" * 75)
    for r in all_results:
        print(f"{r['name']:<25} {r['rps']:>8.1f} {r['error_rate_pct']:>6.1f}% {r['median_ms']:>8.1f}ms {r['p95_ms']:>8.1f}ms {r['p99_ms']:>8.1f}ms")

    slowest = max(all_results, key=lambda r: r["median_ms"])
    print(f"\nSlowest endpoint: {slowest['name']} (median {slowest['median_ms']:.1f} ms)")

    total_requests = sum(r["requests"] for r in all_results)
    total_errors = sum(r["error_rate_pct"] * r["requests"] / 100 for r in all_results)
    print(f"Total requests: {total_requests}")
    print(f"Overall error rate: {total_errors/total_requests*100:.1f}%")
