"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import VideoCall from '../../../components/video-call'

export default function CallPage() {
  const params = useParams()
  const callId = params?.callId || ''

  if (!callId) return <div>Missing callId</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>Call: {callId}</h1>
      <VideoCall callId={callId} />
    </div>
  )
}
