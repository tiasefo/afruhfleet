export function getFleetbaseConsoleUrl() {
  return (
    process.env.NEXT_PUBLIC_FLEETBASE_CONSOLE_URL ||
    'http://10.0.0.115:4202'
  )
}

export function getFleetbaseTrackUrl(trackingNumber?: string) {
  const base = getFleetbaseConsoleUrl()
  if (!trackingNumber) return `${base}/track-order`
  return `${base}/track-order?order=${encodeURIComponent(trackingNumber)}`
}
