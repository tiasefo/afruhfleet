export default function FleetsPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold">Fleets</h1>
      <p className="mt-2 text-gray-600">
        Fleet management will be powered by Fleetbase fleet data.
      </p>

      <a
        href="https://fleet.afruheritage.com/fleet-ops"
        target="_blank"
        className="mt-6 inline-block rounded bg-black px-5 py-3 text-white"
      >
        Manage Fleets in FleetOps
      </a>
    </div>
  )
}
