"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

export default function HomePage() {
  const router = useRouter()
  const [role, setRole] = useState<"patient" | "doctor" | "admin" | null>(null)
  const { t } = useI18n()

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl text-center text-balance">HealthFlow</CardTitle>
            <CardDescription className="text-center text-balance">
              {t("home.tagline", "AI-Powered Healthcare Management Portal")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">{t("home.selectRole", "Select your role to get started")}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/login?role=patient")}
                className="w-full h-12 text-base"
                variant="outline"
              >
                {t("home.patientLogin", "Patient Login")}
              </Button>
              <Button
                onClick={() => router.push("/login?role=doctor")}
                className="w-full h-12 text-base"
                variant="outline"
              >
                {t("home.doctorLogin", "Doctor Login")}
              </Button>
              <Button
                onClick={() => router.push("/login?role=admin")}
                className="w-full h-12 text-base"
                variant="outline"
              >
                {t("home.adminLogin", "Admin Login")}
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("home.newUser", "New user?")}</span>
              </div>
            </div>
            <Button onClick={() => router.push("/signup")} className="w-full h-12 text-base">
              {t("home.createAccount", "Create Account")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
