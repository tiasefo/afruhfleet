# Native Fleetbase Investigation
Generated: Tue Jun  2 11:21:02 PM UTC 2026

## Native Fleetbase Containers
| Component | Status | Evidence |
|---|---|---|
| application | ✅ Running | container found |
| httpd | ✅ Running | container found |
| console | ✅ Running | container found |
| database | ✅ Running | container found |
| cache | ✅ Running | container found |
| queue | ✅ Running | container found |
| scheduler | ✅ Running | container found |
| socket | ✅ Running | container found |
| navigator | ❌ Not found | no container |
| storefront | ❌ Not found | no container |
| ledger | ❌ Not found | no container |
| pallet | ❌ Not found | no container |

## Fleetbase Runtime Source Modules
| Runtime | Status | Evidence |
|---|---|---|
| /mnt/storage/afruheritage-runtimes/74e530f9-2f62-4804-a619-0f7a583a0cae/fleetbase/api | ✅ Core API present | Fleetbase API source |
| /mnt/storage/afruheritage-runtimes/74e530f9-2f62-4804-a619-0f7a583a0cae/fleetbase/console | ✅ Console present | Fleetbase Console source |
| /mnt/storage/afruheritage-runtimes/c34425fb-8b25-4910-b1dc-d5fb630e3fa0/fleetbase/api | ✅ Core API present | Fleetbase API source |
| /mnt/storage/afruheritage-runtimes/c34425fb-8b25-4910-b1dc-d5fb630e3fa0/fleetbase/console | ✅ Console present | Fleetbase Console source |

## Fleetbase Native Routes / Code Signals
| Feature | Status | Evidence |
|---|---|---|
| Native GPS coordinates | ✅ Native signal found | latitude|longitude |
| SocketCluster live channel | ✅ Native signal found | socketcluster|SocketCluster |
| Navigator integration | ❌ Native signal missing/hidden | navigator |
| Dispatch / orders | ✅ Native signal found | dispatch|orders |
| Proof of delivery | ✅ Native signal found | proof|pod|signature|photo |
| Fleet-Ops | ✅ Native signal found | fleet-ops|fleetops |

## Fleetbase Environment
| Check | Status | Evidence |
|---|---|---|
| Fleetbase env GPS/module settings | ⚠️ Weak/missing | No env signals |

## Native Fleetbase HTTP Probes
| Probe | Status | Evidence |
|---|---|---|
| http://10.0.0.115:8004 | ✅ Responds | HTTP 200 |
| http://10.0.0.115:8004/api | ⚠️ Check | HTTP 400 |
| http://10.0.0.115:8004/v1 | ⚠️ Check | HTTP 400 |
| http://10.0.0.115:8004/int/v1 | ⚠️ Check | HTTP 400 |
| http://10.0.0.115:4203 | ✅ Responds | HTTP 200 |
| http://10.0.0.115:38003 | ✅ Responds | HTTP 200 |

## Key Interpretation
| Finding | Meaning |
|---|---|
| Core API/console/socket running | Fleetbase runtime exists |
| Navigator container missing | Driver app not deployed locally |
| Storefront/Ledger/Pallet missing | Those modules are not installed in this runtime |
| Native GPS code exists but not visible | Wrapper/UI is bypassing Fleetbase intelligence |
| Native GPS code missing | Wrong Fleetbase package/version/module set |
