import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    console.log("[API] /api/appointments GET", {
      patientId: !!patientId,
      doctorId: !!doctorId,
      url: request.url,
    })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId
    console.log("[API] /api/appointments GET filter", filter)

    const appointmentsCol = await getCollection("appointments")
    console.log("[API] /api/appointments GET collection ready")
    const items = await appointmentsCol.find(filter).sort({ date: -1 }).toArray()
    console.log("[API] /api/appointments GET query complete")
    console.log("[API] /api/appointments GET success", { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("[API] /api/appointments GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, date, time, status, reason, notes } = body
    console.log("[API] /api/appointments POST", {
      hasPatientId: !!patientId,
      hasDoctorId: !!doctorId,
      hasDate: !!date,
      hasTime: !!time,
      hasStatus: !!status,
      hasReason: !!reason,
      hasNotes: !!notes,
    })
    if (!patientId || !doctorId || !date || !time) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const appointmentsCol = await getCollection("appointments")
    console.log("[API] /api/appointments POST collection ready")
    const doc = {
      patientId,
      doctorId,
      date: new Date(date),
      time,
      status: status || "scheduled",
      reason: reason || null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    console.log("[API] /api/appointments POST payload prepared")

    const result = await appointmentsCol.insertOne(doc)
    console.log("[API] /api/appointments POST created", { insertedId: result.insertedId.toString() })
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    console.error("[API] /api/appointments POST error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}


