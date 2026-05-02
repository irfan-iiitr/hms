"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function AppointmentPage() {
  const router = useRouter()

  // For demo purposes: assume we have an appointment id.
  const appointmentId = '12345'
  const callId = `appt_${appointmentId}`

  return (
    <div style={{ padding: 20 }}>
      <h1>Appointment</h1>
      <p>Appointment ID: {appointmentId}</p>
      <button onClick={() => router.push(`/call/${callId}`)}>Join Call</button>
    </div>
  )
}
