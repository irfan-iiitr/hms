"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

export default function SignupPage() {
  const router = useRouter()
  const { signup, user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log(email, password, name, role)
      await signup(email, password, name, role)
      router.push("/dashboard")
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">{t("signup.title", "Create Account")}</CardTitle>
            <CardDescription className="text-center">{t("signup.subtitle", "Join HealthFlow and manage your healthcare")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("signup.fullName", "Full Name")}</label>
                <Input
                  type="text"
                  placeholder={t("signup.fullNamePlaceholder", "Enter your full name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("signup.email", "Email")}</label>
                <Input
                  type="email"
                  placeholder={t("signup.emailPlaceholder", "Enter your email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("signup.password", "Password")}</label>
                <Input
                  type="password"
                  placeholder={t("signup.passwordPlaceholder", "Create a password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("signup.role", "Role")}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "patient" | "doctor" | "admin")}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="patient">{t("signup.patient", "Patient")}</option>
                  <option value="doctor">{t("signup.doctor", "Doctor")}</option>
                  <option value="admin">{t("signup.admin", "Admin")}</option>
                </select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("signup.creating", "Creating Account...") : t("signup.create", "Create Account")}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("signup.haveAccount", "Already have an account?")} </span>
              <Link href="/" className="text-primary hover:underline">
                {t("signup.signIn", "Sign in")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("signup.backHome", "Back to Home")}
          </Link>
        </div>
      </div>
    </main>
  )
}
