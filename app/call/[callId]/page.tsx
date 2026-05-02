"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import VideoCall from '../../../components/video-call'

export default function CallPage() {
  const params = useParams()
  const callId = params?.callId || ''

  if (!callId) return <div>Missing callId</div>

  return (
    <div style={{ padding: 0 }}>
      <VideoCall callId={callId} />
    </div>
  )
}
