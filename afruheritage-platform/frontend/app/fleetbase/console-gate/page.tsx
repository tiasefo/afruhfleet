import { redirect } from 'next/navigation'

export default function FleetbaseConsoleGate() {
  redirect('/login?next=/fleetbase/console')
}
