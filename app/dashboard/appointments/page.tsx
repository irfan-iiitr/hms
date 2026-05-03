"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchAppointmentsByPatient, fetchDoctors, createAppointment, fetchUsers } from "@/lib/api"
import type { Appointment, User } from "@/lib/types"
import { Calendar, Plus, ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

export default function AppointmentsPage() {
  const { user } = useAuth()
  const { t, language } = useI18n()
  const dateLocale = language === "hi" ? "hi-IN" : "en-US"
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [reason, setReason] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [doctorSlots, setDoctorSlots] = useState<string[]>([])

  useEffect(() => {
    const patientId = user?.id || (user as any)?._id?.toString?.()
    if (!patientId) return
    let mounted = true
    console.log("[AppointmentsPage] Fetching appointments for patient", { patientId })
    fetchAppointmentsByPatient(patientId)
      .then((items) => {
        if (!mounted) return
        console.log("[AppointmentsPage] Appointments fetched", { count: items.length })
        setAppointments(items)
      })
      .catch((fetchError) => {
        console.error("[AppointmentsPage] Failed to fetch appointments", fetchError)
      })
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    fetchDoctors()
      .then((items) => {
        if (!mounted) return
        setDoctors(items)
        if (items.length > 0) {
          setDoctorId((prev) => prev || items[0]?.id || "")
        }
      })
      .catch((fetchError) => {
        setError(t("appt.loadDoctorsError"))
      })
    return () => {
      mounted = false
    }
  }, [])

  // When doctorId changes, fetch that doctor's availableSlots
  useEffect(() => {
    if (!doctorId) {
      setDoctorSlots([])
      return
    }
    // Try to find doctor in loaded list first
    const doc = doctors.find((d) => d.id === doctorId)
    if (doc && Array.isArray((doc as any).availableSlots)) {
      setDoctorSlots((doc as any).availableSlots.map((slot: any) => slot.startTime))
    } else {
      // Fallback: fetch single doctor by id
      fetchUsers({ role: "doctor", query: "" }).then((items) => {
        const found = items.find((d) => d.id === doctorId)
        if (found && Array.isArray((found as any).availableSlots)) {
          setDoctorSlots((found as any).availableSlots.map((slot: any) => slot.startTime))
        } else {
          setDoctorSlots([])
        }
      })
    }
  }, [doctorId, doctors])

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const patientId = user?.id || (user as any)?._id?.toString?.()
    console.log("[AppointmentsPage] Scheduling appointment", {
      patientId,
      doctorId,
      reason,
      date,
      time,
    })
    if (!patientId || !reason || !date || !time || !doctorId) {
      setError(t("appt.missingDetails"))
      return
    }

    setLoading(true)
    try {
      const created = await createAppointment({
        patientId,
        doctorId,
        date: new Date(date),
        time,
        status: "scheduled",
        notes,
        reason,
      })
      console.log("[AppointmentsPage] Appointment scheduled", { appointmentId: created.id })
      setAppointments((prev) => [created, ...prev])
      setReason("")
      setDate("")
      setTime("")
      setNotes("")
      setDoctorId((prev) => prev || doctorId)
      setShowForm(false)
    } catch (err) {
      console.error("[AppointmentsPage] Failed to schedule appointment", err)
      setError(err instanceof Error ? err.message : t("appt.scheduleError"))
    } finally {
      setLoading(false)
    }
  }

  const scheduled = appointments.filter((a) => a.status === "scheduled")
  const completed = appointments.filter((a) => a.status === "completed")

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-balance">{t("appt.title")}</h1>
              <p className="text-muted-foreground">{t("appt.subtitle")}</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("appt.scheduleShort")}
            </Button>
          </div>

          {/* Add Appointment Form */}
          {showForm && (
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <CardTitle>{t("appt.scheduleNewTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleAddAppointment} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("appt.reason")}</label>
                    <Input
                      placeholder={t("appt.reasonPh")}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("appt.date")}</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("appt.time")}</label>
                      {/* Show only available slots for selected doctor */}
                      {doctorSlots.length > 0 ? (
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                          required
                        >
                          <option value="" disabled>
                            {t("appt.selectTime")}
                          </option>
                          {doctorSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("mr.selectDoctor")}</label>
                    <select
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      required
                    >
                      {doctors.length === 0 ? (
                        <option value="" disabled>
                          {t("appt.noDoctors")}
                        </option>
                      ) : (
                        doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name || doctor.email}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("appt.notesOptional")}</label>
                    <textarea
                      className="w-full min-h-20 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder={t("appt.notesPh")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || doctors.length === 0}>
                      {loading ? t("appt.scheduling") : t("appt.scheduleSubmit")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Appointments */}
          {scheduled.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                {t("appt.upcomingTitle")}
              </h2>
              <div className="space-y-3">
                {scheduled.map((apt) => {
                  const callId = `appt_${apt.id}`
                  const isNow = true // optional: implement time check to enable/disable
                  return (
                    <Card key={apt.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{apt.reason}</h3>
                            <p className="text-muted-foreground">
                              {new Date(apt.date).toLocaleDateString(dateLocale, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              {t("appt.atTime", undefined, { time: apt.time })}
                            </p>
                            {apt.doctorId && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {t("mr.doctorLine", undefined, {
                                  name:
                                    doctors.find((d) => d.id === apt.doctorId)?.name || String(apt.doctorId),
                                })}
                              </p>
                            )}
                            {apt.notes && <p className="text-sm mt-2">{apt.notes}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {t("appt.statusScheduled")}
                            </span>
                            <Link href={`/call/${callId}`}>
                              <Button disabled={!isNow}>{t("demoAppt.join")}</Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Appointments */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                {t("appt.completedTitle")}
              </h2>
              <div className="space-y-3">
                {completed.map((apt) => (
                  <Card key={apt.id} className="opacity-75 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{apt.reason}</h3>
                          <p className="text-muted-foreground">
                            {new Date(apt.date).toLocaleDateString(dateLocale, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            {t("appt.atTime", undefined, { time: apt.time })}
                          </p>
                          {apt.doctorId && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("mr.doctorLine", undefined, {
                                name:
                                  doctors.find((d) => d.id === apt.doctorId)?.name || String(apt.doctorId),
                              })}
                            </p>
                          )}
                        </div>
                        <span className="bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {t("appt.statusCompleted")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>{t("appt.emptyHint")}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
