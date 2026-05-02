"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeaders } from "@/lib/auth-client"
import type { StreamVideoClient as SVClientType, Call as SVCall } from "@stream-io/video-react-sdk"
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk"
import "@stream-io/video-react-sdk/dist/css/styles.css"

export default function VideoCall({ callId }: { callId: string }) {
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<SVClientType | null>(null)
  const [call, setCall] = useState<SVCall | null>(null)

  useEffect(() => {
    let mounted = true
    let localClient: SVClientType | null = null
    let localCall: SVCall | null = null

    async function init() {
      setLoading(true)
      setError(null)

      if (isLoading) return
      if (!user) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/stream-token", {
          method: "POST",
          headers: { ...(getAuthHeaders() as any) },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to get token")

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || ""
        localClient = new StreamVideoClient({ apiKey, user: { id: user.id }, token: data.token })

        localCall = localClient.call("default", callId)
        await localCall.join({ create: true })

        if (!mounted) return
        setClient(localClient)
        setCall(localCall)
      } catch (err: any) {
        setError(err?.message || "Unknown error")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      ;(async () => {
        try {
          if (localCall) await localCall.leave()
        } catch {}
        try {
          if (localClient) await localClient.disconnectUser()
        } catch {}
      })()
    }
  }, [isLoading, user, callId])

  if (loading) return <div>Joining call...</div>
  if (error) return <div>Error: {error}</div>
  if (!client || !call) return null

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SpeakerLayout participantBarPosition="right" />
            <CallControls />
          </div>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  )
}
