import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth, isGoogleAuthEnabled } from "@/lib/auth"
import { AuthForm } from "@/components/auth-form"

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")
  return <AuthForm mode="sign-in" googleEnabled={isGoogleAuthEnabled} />
}
