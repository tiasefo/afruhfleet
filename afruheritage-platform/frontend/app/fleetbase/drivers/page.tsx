'use client'

import { useEffect, useState } from 'react'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDrivers() {
      try {
        const res = await fetch('/api/v1/fleetbase-proxy/drivers', {
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error(await res.text())
        }

        const data = await res.json()
        setDrivers(data.drivers || [])
        setMeta(data.meta || null)
      } catch (err: any) {
        setError(err?.message || 'Failed to load Fleetbase drivers')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [])

  if (loading) {
    return <div className="p-8">Loading Fleetbase drivers...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Fleetbase Drivers</h1>
        <p className="mt-4 text-red-600">{error}</p>
        <a
          className="mt-4 inline-block rounded bg-black px-4 py-2 text-white"
          href="https://fleet.afruheritage.com"
          target="_blank"
        >
          Open FleetOps Console
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleetbase Drivers</h1>
          <p className="text-gray-600">Live driver data from Fleetbase FleetOps</p>
        </div>

        <a
          className="rounded bg-black px-4 py-2 text-white"
          href="https://fleet.afruheritage.com/fleet-ops"
          target="_blank"
        >
          Open FleetOps Console
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-gray-500">Total Drivers</p>
          <p className="text-2xl font-bold">{meta?.total ?? drivers.length}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-gray-500">Online</p>
          <p className="text-2xl font-bold">{drivers.filter((d) => d.online).length}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-gray-500">With Vehicle</p>
          <p className="text-2xl font-bold">{drivers.filter((d) => d.vehicle || d.vehicle_uuid).length}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-gray-500">Currency</p>
          <p className="text-2xl font-bold">{drivers[0]?.currency || '—'}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Driver</th>
              <th className="p-3">Phone</th>
              <th className="p-3">City</th>
              <th className="p-3">Country</th>
              <th className="p-3">Online</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Public ID</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.uuid || driver.public_id} className="border-t">
                <td className="p-3 font-medium">{driver.name || driver.user?.name || 'Unnamed Driver'}</td>
                <td className="p-3">{driver.phone || driver.user?.phone || '—'}</td>
                <td className="p-3">{driver.city || '—'}</td>
                <td className="p-3">{driver.country || '—'}</td>
                <td className="p-3">{driver.online ? 'Yes' : 'No'}</td>
                <td className="p-3">{driver.vehicle_name || driver.vehicle?.name || 'Not assigned'}</td>
                <td className="p-3">{driver.public_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
