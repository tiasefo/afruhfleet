'use client'

import { useState } from 'react'

export default function GuestUsageAdminPage() {
  const [guestId, setGuestId] = useState('')
  const [message, setMessage] = useState('')

  async function resetGuest() {
    setMessage('')
    const res = await fetch(`/api/v1/customs/guest/admin/reset-guest/${guestId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    setMessage(data.message || JSON.stringify(data))
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Customs Guest Usage Control</h1>
        <p className="mt-2 text-slate-600">
          Reset guest duty-check limits for UAT devices.
        </p>

        <div className="mt-6">
          <label className="font-medium">Guest ID</label>
          <input
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3"
            placeholder="test-guest-001"
          />
        </div>

        <button
          onClick={resetGuest}
          disabled={!guestId}
          className="mt-6 rounded-lg bg-[#063f4f] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Reset Guest Limit
        </button>

        {message && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-green-700">{message}</p>
        )}
      </div>
    </main>
  )
}
