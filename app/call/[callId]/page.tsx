"use client"

import React from "react"
import { useParams } from "next/navigation"
import VideoCall from "../../../components/video-call"
import { useI18n } from "@/lib/i18n"

export default function CallPage() {
  const params = useParams()
  const rawId = params?.callId
  const callId = typeof rawId === "string" ? rawId : rawId?.[0] ?? ""
  const { t } = useI18n()

  if (!callId) return <div>{t("call.missingId")}</div>

  return (
    <div style={{ padding: 0 }}>
      <VideoCall callId={callId} />
    </div>
  )
}
