"use client"

import { useMemo, useState } from "react"
import {
  X,
  MapPin,
  Package,
  Boxes,
  Weight,
  ImagePlus,
  Snowflake,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Coins,
  Loader2,
  User,
  Phone,
  Star,
  BadgeCheck,
} from "lucide-react"

export type Vendor = {
  name: string
  type: string
  rating: number
  trips: number
  region: string
  baseRate: number // GHS per km
}

type ShipmentDraft = {
  customer_name: string
  customer_phone: string
  title: string
  description: string
  pickup_label: string
  pickup_latitude: string
  pickup_longitude: string
  dropoff_label: string
  dropoff_latitude: string
  dropoff_longitude: string
  weight_kg: string
  length_cm: string
  width_cm: string
  height_cm: string
  package_count: string
  package_value: string
  fragile: boolean
  refrigerated: boolean
  special_handling_notes: string
  image_names: string[]
}

const emptyDraft: ShipmentDraft = {
  customer_name: "",
  customer_phone: "",
  title: "",
  description: "",
  pickup_label: "",
  pickup_latitude: "",
  pickup_longitude: "",
  dropoff_label: "",
  dropoff_latitude: "",
  dropoff_longitude: "",
  weight_kg: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  package_count: "1",
  package_value: "",
  fragile: false,
  refrigerated: false,
  special_handling_notes: "",
  image_names: [],
}

const steps = ["Contact", "Route", "Package", "Review"] as const

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
const labelClass = "mb-1.5 block text-sm font-medium text-foreground"

export function BookingForm({
  vendor,
  onClose,
}: {
  vendor: Vendor
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ShipmentDraft>(emptyDraft)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")

  function set<K extends keyof ShipmentDraft>(key: K, value: ShipmentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  // Auto price estimate from coordinates + weight (mirrors suggested_price)
  const distanceKm = useMemo(() => {
    const a = [Number(draft.pickup_latitude), Number(draft.pickup_longitude)]
    const b = [Number(draft.dropoff_latitude), Number(draft.dropoff_longitude)]
    if (a.some((n) => !Number.isFinite(n) || n === 0) || b.some((n) => !Number.isFinite(n) || n === 0)) {
      return 0
    }
    return haversineKm(a[0], a[1], b[0], b[1])
  }, [draft.pickup_latitude, draft.pickup_longitude, draft.dropoff_latitude, draft.dropoff_longitude])

  const estimate = useMemo(() => {
    if (distanceKm <= 0) return 0
    const weight = Number(draft.weight_kg) || 0
    let price = 25 + distanceKm * vendor.baseRate + weight * 0.5
    if (draft.fragile) price *= 1.1
    if (draft.refrigerated) price *= 1.2
    return Math.round(price)
  }, [distanceKm, draft.weight_kg, draft.fragile, draft.refrigerated, vendor.baseRate])

  const stepValid = useMemo(() => {
    if (step === 0) return draft.customer_name.trim() && draft.customer_phone.trim() && draft.title.trim()
    if (step === 1) return draft.pickup_label.trim() && draft.dropoff_label.trim()
    if (step === 2) return Number(draft.weight_kg) > 0 && Number(draft.package_count) > 0
    return true
  }, [step, draft])

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1)
  }
  function back() {
    if (step > 0) setStep((s) => s - 1)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    set("image_names", [...draft.image_names, ...Array.from(files).map((f) => f.name)].slice(0, 6))
  }

  function submit() {
    setSubmitting(true)
    // Mirrors POST /marketplace/shipments — demo only, no backend wired.
    setTimeout(() => {
      const tn = `AFR-2026-${String(Math.floor(100000 + Math.random() * 899999)).slice(0, 6)}`
      setTrackingNumber(tn)
      setSubmitting(false)
      setDone(true)
    }, 1100)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight">Book {vendor.name}</h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{vendor.type}</span>
                <span>·</span>
                <Star className="size-3 fill-accent text-accent" />
                {vendor.rating}
                <BadgeCheck className="size-3 text-primary" />
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking form"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-9" />
            </span>
            <h3 className="font-heading text-xl font-bold">Shipment posted</h3>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Your request was sent to {vendor.name}. Track it with the number below — you&apos;ll be
              notified when they confirm the booking.
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 font-mono text-sm font-semibold text-primary">
              <Package className="size-4" />
              {trackingNumber}
            </span>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              {steps.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      i < step
                        ? "bg-primary text-primary-foreground"
                        : i === step
                          ? "bg-primary/15 text-primary ring-2 ring-primary"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      i === step ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === 0 && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Customer name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          className={`${fieldClass} pl-9`}
                          placeholder="John Doe"
                          value={draft.customer_name}
                          onChange={(e) => set("customer_name", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Phone number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          className={`${fieldClass} pl-9`}
                          placeholder="+233 ..."
                          value={draft.customer_phone}
                          onChange={(e) => set("customer_phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Shipment title</label>
                    <input
                      className={fieldClass}
                      placeholder="Deliver furniture to Accra"
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${fieldClass} min-h-20 resize-y`}
                      placeholder="3 boxes, fragile items"
                      value={draft.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <MapPin className="size-4" /> Pickup
                    </p>
                    <div className="flex flex-col gap-3">
                      <input
                        className={fieldClass}
                        placeholder="123 Main St, Accra"
                        value={draft.pickup_label}
                        onChange={(e) => set("pickup_label", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className={fieldClass}
                          placeholder="Latitude (5.6037)"
                          value={draft.pickup_latitude}
                          onChange={(e) => set("pickup_latitude", e.target.value)}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Longitude (-0.1870)"
                          value={draft.pickup_longitude}
                          onChange={(e) => set("pickup_longitude", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                      <MapPin className="size-4 text-accent" /> Drop-off
                    </p>
                    <div className="flex flex-col gap-3">
                      <input
                        className={fieldClass}
                        placeholder="456 Market St, Kumasi"
                        value={draft.dropoff_label}
                        onChange={(e) => set("dropoff_label", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className={fieldClass}
                          placeholder="Latitude (6.6885)"
                          value={draft.dropoff_latitude}
                          onChange={(e) => set("dropoff_latitude", e.target.value)}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Longitude (-1.6244)"
                          value={draft.dropoff_longitude}
                          onChange={(e) => set("dropoff_longitude", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {distanceKm > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Estimated trip distance:{" "}
                      <span className="font-semibold text-foreground">{distanceKm.toFixed(1)} km</span>
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        <Weight className="mr-1 inline size-3.5" /> Weight (kg)
                      </label>
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="50"
                        value={draft.weight_kg}
                        onChange={(e) => set("weight_kg", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <Boxes className="mr-1 inline size-3.5" /> Package count
                      </label>
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="3"
                        value={draft.package_count}
                        onChange={(e) => set("package_count", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="L 100"
                        value={draft.length_cm}
                        onChange={(e) => set("length_cm", e.target.value)}
                      />
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="W 50"
                        value={draft.width_cm}
                        onChange={(e) => set("width_cm", e.target.value)}
                      />
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="H 40"
                        value={draft.height_cm}
                        onChange={(e) => set("height_cm", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Declared value (GHS)</label>
                    <input
                      type="number"
                      className={fieldClass}
                      placeholder="5000"
                      value={draft.package_value}
                      onChange={(e) => set("package_value", e.target.value)}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => set("fragile", !draft.fragile)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        draft.fragile ? "border-primary bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      <span
                        className={`flex size-9 items-center justify-center rounded-md ${
                          draft.fragile ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <AlertTriangle className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">Fragile</span>
                        <span className="block text-xs text-muted-foreground">Extra care handling</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set("refrigerated", !draft.refrigerated)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        draft.refrigerated ? "border-primary bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      <span
                        className={`flex size-9 items-center justify-center rounded-md ${
                          draft.refrigerated ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Snowflake className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">Refrigerated</span>
                        <span className="block text-xs text-muted-foreground">Cold chain required</span>
                      </span>
                    </button>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className={labelClass}>Photos</label>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-primary/50">
                      <ImagePlus className="size-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Drag &amp; drop or <span className="font-medium text-primary">browse</span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </label>
                    {draft.image_names.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {draft.image_names.map((n, i) => (
                          <span
                            key={`${n}-${i}`}
                            className="max-w-[12rem] truncate rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Special handling notes</label>
                    <textarea
                      className={`${fieldClass} min-h-16 resize-y`}
                      placeholder="Handle with care"
                      value={draft.special_handling_notes}
                      onChange={(e) => set("special_handling_notes", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <h3 className="font-heading text-sm font-semibold">{draft.title || "Untitled shipment"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{draft.description || "No description"}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">From</dt>
                        <dd className="font-medium">{draft.pickup_label || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">To</dt>
                        <dd className="font-medium">{draft.dropoff_label || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Weight</dt>
                        <dd className="font-medium">{draft.weight_kg || "0"} kg · {draft.package_count} pkg</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Distance</dt>
                        <dd className="font-medium">{distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : "—"}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {draft.fragile && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          <AlertTriangle className="size-3" /> Fragile
                        </span>
                      )}
                      {draft.refrigerated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Snowflake className="size-3" /> Refrigerated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price estimate */}
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div>
                      <p className="text-sm font-medium">Estimated price</p>
                      <p className="text-xs text-muted-foreground">Final price set by vendor bid</p>
                    </div>
                    <p className="font-heading text-2xl font-bold text-primary">
                      {estimate > 0 ? `GHS ${estimate}` : "—"}
                    </p>
                  </div>

                  {/* Credit confirmation */}
                  <p className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <Coins className="mt-0.5 size-4 shrink-0 text-accent" />
                    Posting this shipment deducts <span className="font-medium text-foreground">1 marketplace_post credit</span>.
                    GPS tracking pings are billed separately.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border p-5">
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-0"
              >
                <ChevronLeft className="size-4" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!stepValid}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Posting…
                    </>
                  ) : (
                    <>
                      <Coins className="size-4" /> Post shipment
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
