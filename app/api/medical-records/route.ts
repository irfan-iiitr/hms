import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    console.log("[API] /api/medical-records GET", {
      patientId: !!patientId,
      doctorId: !!doctorId,
      url: request.url,
    })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId
    console.log("[API] /api/medical-records GET filter", filter)

    const recordsCol = await getCollection("medical_records")
    console.log("[API] /api/medical-records GET collection ready")
    const items = await recordsCol.find(filter).sort({ date: -1 }).toArray()
    console.log("[API] /api/medical-records GET query complete")
    console.log("[API] /api/medical-records GET success", { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("[API] /api/medical-records GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, date, diagnosis, symptoms, notes, attachments } = body
    console.log("[API] /api/medical-records POST", {
      hasPatientId: !!patientId,
      hasDoctorId: !!doctorId,
      hasDate: !!date,
      hasDiagnosis: !!diagnosis,
      hasSymptoms: Array.isArray(symptoms),
      hasNotes: !!notes,
      hasAttachments: Array.isArray(attachments),
    })
    if (!patientId || !doctorId || !diagnosis) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const recordsCol = await getCollection("medical_records")
    console.log("[API] /api/medical-records POST collection ready")
    const doc = {
      patientId,
      doctorId,
      date: date ? new Date(date) : new Date(),
      diagnosis,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || null,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    console.log("[API] /api/medical-records POST payload prepared")

    const result = await recordsCol.insertOne(doc)
    console.log("[API] /api/medical-records POST created", { insertedId: result.insertedId.toString() })
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    console.error("[API] /api/medical-records POST error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}


