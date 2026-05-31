"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { getApiBaseUrl, getCookie, joinApiUrl } from "@/lib/api"

type Booking = {
  id: string
  tenant_id: string
  shipment_id?: string | null
  status: string
  pickup_address?: string | null
  delivery_address?: string | null
  credit_cost: number
  currency: string
  created_at?: string
}

type BookingListResponse = {
  items: Booking[]
}

export function VendorOperations() {
  const apiBaseUrl = getApiBaseUrl()
  const token = getCookie("afruheritage_access_token")
  const watchIdRef = useRef<number | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState("")
  const [bookingMessage, setBookingMessage] = useState("")

  const [submittingDocuments, setSubmittingDocuments] = useState(false)
  const [documentsError, setDocumentsError] = useState("")
  const [documentsMessage, setDocumentsMessage] = useState("")

  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null)
  const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null)
  const [roadworthyDoc, setRoadworthyDoc] = useState<File | null>(null)

  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null)
  const [trackingMessage, setTrackingMessage] = useState("")
  const [trackingError, setTrackingError] = useState("")
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  const canCallVendorApis = Boolean(apiBaseUrl && token)

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => ["offered", "pending"].includes(booking.status.toLowerCase())),
    [bookings]
  )

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  async function loadBookings() {
    setBookingsLoading(true)
    setBookingsError("")
    setBookingMessage("")

    if (!apiBaseUrl || !token) {
      setBookingsLoading(false)
      setBookingsError("Vendor operations require login. Please sign in first.")
      return
    }

    try {
      const response = await fetch(joinApiUrl(apiBaseUrl, "/vendors/me/bookings?page=1&page_size=25"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }

      const payload = (await response.json()) as BookingListResponse
      setBookings(Array.isArray(payload.items) ? payload.items : [])
      setBookingMessage("Bookings loaded successfully.")
    } catch (error: unknown) {
      setBookingsError(error instanceof Error ? error.message : "Failed to load bookings")
    } finally {
      setBookingsLoading(false)
    }
  }

  async function decideBooking(bookingId: string, action: "accept" | "reject") {
    if (!apiBaseUrl || !token) {
      setBookingsError("Vendor operations require login. Please sign in first.")
      return
    }

    setBookingMessage("")
    setBookingsError("")

    try {
      const response = await fetch(joinApiUrl(apiBaseUrl, `/vendors/me/bookings/${bookingId}/${action}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: "Updated from web vendor operations" }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setBookingMessage(`Booking ${action}ed successfully.`)
      await loadBookings()
    } catch (error: unknown) {
      setBookingsError(error instanceof Error ? error.message : `Failed to ${action} booking`)
    }
  }

  async function submitDocuments() {
    if (!apiBaseUrl || !token) {
      setDocumentsError("Document upload requires login. Please sign in first.")
      return
    }

    if (!idFront && !idBack && !selfiePhoto && !insuranceDoc && !roadworthyDoc) {
      setDocumentsError("Select at least one document before submitting.")
      return
    }

    setSubmittingDocuments(true)
    setDocumentsError("")
    setDocumentsMessage("")

    try {
      const formData = new FormData()
      if (idFront) formData.append("id_front", idFront)
      if (idBack) formData.append("id_back", idBack)
      if (selfiePhoto) formData.append("selfie_photo", selfiePhoto)
      if (insuranceDoc) formData.append("insurance_doc", insuranceDoc)
      if (roadworthyDoc) formData.append("roadworthy_doc", roadworthyDoc)

      const response = await fetch(joinApiUrl(apiBaseUrl, "/vendors/me/documents"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setDocumentsMessage("Vendor documents submitted for admin review.")
      setIdFront(null)
      setIdBack(null)
      setSelfiePhoto(null)
      setInsuranceDoc(null)
      setRoadworthyDoc(null)
    } catch (error: unknown) {
      setDocumentsError(error instanceof Error ? error.message : "Failed to submit documents")
    } finally {
      setSubmittingDocuments(false)
    }
  }

  function stopLiveTracking() {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setTrackingBookingId(null)
    setTrackingMessage("Live GPS stopped.")
  }

  async function postTrackingPoint(booking: Booking, latitude: number, longitude: number) {
    if (!apiBaseUrl || !token || !booking.shipment_id) return

    const response = await fetch(
      joinApiUrl(apiBaseUrl, `/shipments/${booking.tenant_id}/${booking.shipment_id}/tracking/point`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          location: `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
          provider: "browser_gps",
          speed_kmh: null,
          accuracy_meters: null,
          heading_degrees: null,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }
  }

  function startLiveTracking(booking: Booking) {
    if (!apiBaseUrl || !token) {
      setTrackingError("Live tracking requires login. Please sign in first.")
      return
    }
    if (!booking.shipment_id) {
      setTrackingError("This booking has no linked shipment_id for tracking.")
      return
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setTrackingError("Geolocation is not available in this browser.")
      return
    }

    setTrackingError("")
    setTrackingMessage("Starting GPS watch...")

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setLastCoords({ latitude, longitude })

        void postTrackingPoint(booking, latitude, longitude)
          .then(() => {
            setTrackingBookingId(booking.id)
            setTrackingMessage("Live GPS point submitted.")
          })
          .catch((error: unknown) => {
            setTrackingError(error instanceof Error ? error.message : "Failed to submit GPS point")
          })
      },
      (error) => {
        setTrackingError(error.message || "Unable to read GPS location")
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    )

    watchIdRef.current = watchId
  }

  return (
    <section id="vendor-operations" className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Badge variant="outline" className="mb-4">Vendor Self-Service</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Vendor Operations Dashboard</h2>
          <p className="mt-3 text-muted-foreground">
            This section closes web parity for vendor document upload, booking accept/reject, and live GPS point ingestion.
          </p>
          {!canCallVendorApis ? (
            <p className="mt-3 text-sm text-amber-700">
              Login required: set an active session before calling vendor APIs.
            </p>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Documents Upload</CardTitle>
            <CardDescription>Submit ID, selfie, insurance, and roadworthy files to /vendors/me/documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="id-front">ID Front</Label>
                <Input id="id-front" type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id-back">ID Back</Label>
                <Input id="id-back" type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selfie-photo">Selfie Photo</Label>
                <Input id="selfie-photo" type="file" accept="image/*" onChange={(e) => setSelfiePhoto(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance-doc">Insurance Document</Label>
                <Input id="insurance-doc" type="file" onChange={(e) => setInsuranceDoc(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="roadworthy-doc">Roadworthy Document</Label>
                <Input id="roadworthy-doc" type="file" onChange={(e) => setRoadworthyDoc(e.target.files?.[0] || null)} />
              </div>
            </div>

            <Button onClick={() => void submitDocuments()} disabled={submittingDocuments || !canCallVendorApis}>
              {submittingDocuments ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                "Submit Vendor Documents"
              )}
            </Button>

            {documentsError ? <p className="text-sm text-red-600">{documentsError}</p> : null}
            {documentsMessage ? <p className="text-sm text-emerald-700">{documentsMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Booking Decisions</CardTitle>
            <CardDescription>Load /vendors/me/bookings and accept or reject pending offers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void loadBookings()} disabled={bookingsLoading || !canCallVendorApis}>
                {bookingsLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  "Load My Bookings"
                )}
              </Button>
              <Badge variant="secondary">Pending/Offered: {pendingBookings.length}</Badge>
            </div>

            {bookingsError ? <p className="text-sm text-red-600">{bookingsError}</p> : null}
            {bookingMessage ? <p className="text-sm text-emerald-700">{bookingMessage}</p> : null}
            {trackingError ? <p className="text-sm text-red-600">{trackingError}</p> : null}
            {trackingMessage ? <p className="text-sm text-emerald-700">{trackingMessage}</p> : null}
            {lastCoords ? (
              <p className="text-xs text-muted-foreground">
                Last GPS: {lastCoords.latitude.toFixed(5)}, {lastCoords.longitude.toFixed(5)}
              </p>
            ) : null}

            <div className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings loaded yet.</p>
              ) : (
                bookings.map((booking) => {
                  const status = booking.status.toLowerCase()
                  const actionable = status === "offered" || status === "pending"

                  return (
                    <div key={booking.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">Booking {booking.id}</p>
                          <p className="text-xs text-muted-foreground">
                            Tenant {booking.tenant_id} • Shipment {booking.shipment_id || "N/A"}
                          </p>
                        </div>
                        <Badge variant={actionable ? "outline" : "secondary"}>{booking.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {booking.pickup_address || "No pickup"} {" -> "} {booking.delivery_address || "No delivery"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cost: {booking.credit_cost} {booking.currency}
                      </p>
                      {actionable ? (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => void decideBooking(booking.id, "accept")}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => void decideBooking(booking.id, "reject")}>Reject</Button>
                        </div>
                      ) : null}
                      {booking.shipment_id ? (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startLiveTracking(booking)}
                            disabled={!canCallVendorApis || (trackingBookingId !== null && trackingBookingId !== booking.id)}
                          >
                            Start Live GPS
                          </Button>
                          {trackingBookingId === booking.id ? (
                            <Button size="sm" variant="outline" onClick={stopLiveTracking}>
                              Stop Live GPS
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
