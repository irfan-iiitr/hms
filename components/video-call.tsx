"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeaders } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { StreamVideoClient as SVClientType, Call as SVCall } from "@stream-io/video-react-sdk"
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  useCall,
  ParticipantView,
  hasVideo,
  hasAudio,
} from "@stream-io/video-react-sdk"
import "@stream-io/video-react-sdk/dist/css/styles.css"

// Separate component to use hooks inside StreamCall context
function VideoCallUI() {
  const { useParticipants, useLocalParticipant, useCameraState, useMicrophoneState, useSpeakerState, useCallCallingState } = useCallStateHooks()
  const call = useCall()
  const allParticipants = useParticipants()
  const localParticipant = useLocalParticipant()
  const { camera, isMute: isCameraMuted } = useCameraState()
  const { microphone, isMute: isMicMuted } = useMicrophoneState()
  const { speaker } = useSpeakerState()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  // Filter to only show participants who are actively publishing video/audio
  // Deduplicate by userId to handle multiple sessions from rejoin
  const getUniqueActiveParticipants = () => {
    const userMap = new Map<string, any>()
    
    // Collect unique users (keep most recent session per user)
    allParticipants.forEach((p) => {
      const existing = userMap.get(p.userId)
      if (!existing) {
        userMap.set(p.userId, p)
      } else if (p.isLocalParticipant) {
        // Always prioritize local participant
        userMap.set(p.userId, p)
      } else {
        // For remote, keep the one with later joinedAt
        const newTime = new Date(p.joinedAt).getTime()
        const existingTime = new Date(existing.joinedAt).getTime()
        if (newTime > existingTime) {
          userMap.set(p.userId, p)
        }
      }
    })
    
    // Filter to only active ones (publishing tracks or having audio/video)
    return Array.from(userMap.values()).filter((p) => {
      if (p.isLocalParticipant) return true
      try {
        // Prefer SDK helpers when available
        if (hasVideo(p) || hasAudio(p)) return true
      } catch (e) {
        // fallback to publishedTracks or videoStream
      }
      return Boolean((p.publishedTracks && p.publishedTracks.length > 0) || p.videoStream)
    })
  }

  const activeParticipants = getUniqueActiveParticipants()
  const totalUniqueUsers = new Set(allParticipants.map((p) => p.userId)).size
  const inactiveCount = totalUniqueUsers - activeParticipants.length
  const callingState = useCallCallingState()

  const handleBack = async () => {
    setLeaving(true)
    try {
      console.log("[VideoCallUI] Starting cleanup...")
      
      // Disable camera - must await
      try {
        console.log("[VideoCallUI] Disabling camera...")
        await camera.disable()
        console.log("[VideoCallUI] Camera disabled successfully")
      } catch (err) {
        console.error("[VideoCallUI] Error disabling camera:", err)
      }

      // Disable microphone - must await
      try {
        console.log("[VideoCallUI] Disabling microphone...")
        await microphone.disable()
        console.log("[VideoCallUI] Microphone disabled successfully")
      } catch (err) {
        console.error("[VideoCallUI] Error disabling microphone:", err)
      }

      // Disable speaker
      try {
        console.log("[VideoCallUI] Disabling speaker...")
        await speaker.disable?.()
        console.log("[VideoCallUI] Speaker disabled successfully")
      } catch (err) {
        console.error("[VideoCallUI] Error disabling speaker:", err)
      }

      // Leave call only if it looks like we're joined/ringing
      if (call) {
        try {
          if (!callingState || callingState === "JOINED" || callingState === "RINGING") {
            console.log("[VideoCallUI] Leaving call...")
            await call.leave()
            console.log("[VideoCallUI] Call left successfully")
          } else {
            console.log("[VideoCallUI] Skipping leave; callingState=", callingState)
          }
        } catch (err: any) {
          // ignore 'already been left' style errors
          const msg = String(err?.message || err)
          if (msg.toLowerCase().includes("already been left") || msg.toLowerCase().includes("already left")) {
            console.log("[VideoCallUI] Call was already left; ignoring error")
          } else {
            console.error("[VideoCallUI] Error leaving call:", err)
          }
        }
      }
    } catch (err) {
      console.error("[VideoCallUI] Error during cleanup:", err)
    } finally {
      // Navigate back to appointments with explicit path
      console.log("[VideoCallUI] Navigating to appointments...")
      router.push("/dashboard/appointments")
    }
  }

  return (
    <StreamTheme>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Video Consultation</p>
              <p className="text-xs text-muted-foreground">
                {activeParticipants.length} {activeParticipants.length === 1 ? "person" : "people"} in call
                {inactiveCount > 0 && <span className="text-xs ml-2">({inactiveCount} inactive)</span>}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleBack} disabled={leaving}>
              {leaving ? "Leaving..." : "Back"}
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3">
          {/* Custom participant rendering - only show active participants */}
          <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
            {activeParticipants.length > 0 ? (
              <div className="w-full h-full flex gap-2 p-2">
                {activeParticipants.map((participant) => (
                  <div key={participant.sessionId} className="flex-1">
                    <ParticipantView participant={participant} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No active participants</p>
              </div>
            )}
          </div>
          <CallControls />
        </main>
      </div>
    </StreamTheme>
  )
}

export default function VideoCall({ callId }: { callId: string }) {
  const router = useRouter()
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
        console.log("[VideoCall] Joining call:", callId, "as user:", user.id)
        await localCall.join({ create: true })

        if (!mounted) return
        setClient(localClient)
        setCall(localCall)
      } catch (err: any) {
        console.error("[VideoCall] Init error:", err)
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
          if (localCall) {
            console.log("[VideoCall] Component unmounted - leaving call")
            await localCall.leave()
          }
          if (localClient) {
            console.log("[VideoCall] Component unmounted - disconnecting client")
            await localClient.disconnectUser()
          }
        } catch (err) {
          console.error("[VideoCall] Error during component cleanup:", err)
        }
      })()
    }
  }, [isLoading, user, callId])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Joining secure consultation room...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-lg border bg-card p-4 text-card-foreground">
          <p className="font-semibold">Unable to start video consultation</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => router.push("/dashboard/appointments")}>Back to appointments</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!client || !call) return null

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallUI />
      </StreamCall>
    </StreamVideo>
  )
}
