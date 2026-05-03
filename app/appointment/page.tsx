"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"

export default function AppointmentPage() {
  const router = useRouter()
  const { t } = useI18n()

  const appointmentId = "12345"
  const callId = `appt_${appointmentId}`

  return (
    <div style={{ padding: 20 }}>
      <h1>{t("demoAppt.title")}</h1>
      <p>
        {t("demoAppt.idLabel")}: {appointmentId}
      </p>
      <button type="button" onClick={() => router.push(`/call/${callId}`)}>
        {t("demoAppt.join")}
      </button>
    </div>
  )
}
