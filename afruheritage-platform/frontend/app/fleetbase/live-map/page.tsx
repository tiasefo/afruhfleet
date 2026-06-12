export default function LiveMapPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold">Live Fleet Map</h1>
      <p className="mt-2 text-gray-600">
        Live GPS, tracking, dispatch, and map intelligence are available in Fleetbase FleetOps.
      </p>

      <a
        href="https://fleet.afruheritage.com/fleet-ops"
        target="_blank"
        className="mt-6 inline-block rounded bg-black px-5 py-3 text-white"
      >
        Open Live FleetOps Map
      </a>
    </div>
  )
}
