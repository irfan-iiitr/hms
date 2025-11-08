import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    const recordId = searchParams.get("recordId") || undefined
    console.log("[API] /api/prescriptions GET", {
      patientId: !!patientId,
      doctorId: !!doctorId,
      recordId: !!recordId,
      url: request.url,
    })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId
    if (recordId) filter.recordId = recordId
    console.log("[API] /api/prescriptions GET filter", filter)

    const col = await getCollection("prescriptions")
    console.log("[API] /api/prescriptions GET collection ready")
    const items = await col.find(filter).sort({ issuedDate: -1 }).toArray()
    console.log("[API] /api/prescriptions GET query complete")
    console.log("[API] /api/prescriptions GET success", { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("[API] /api/prescriptions GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, patientId, doctorId, medications, notes, issuedDate, expiryDate } = body
    console.log("[API] /api/prescriptions POST", {
      hasRecordId: !!recordId,
      hasPatientId: !!patientId,
      hasDoctorId: !!doctorId,
      hasMedications: Array.isArray(medications),
      hasNotes: !!notes,
      hasIssuedDate: !!issuedDate,
      hasExpiryDate: !!expiryDate,
    })
    if (!recordId || !patientId || !doctorId || !Array.isArray(medications)) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const col = await getCollection("prescriptions")
    console.log("[API] /api/prescriptions POST collection ready")
    const doc = {
      recordId,
      patientId,
      doctorId,
      medications,
      notes: notes || null,
      issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    }
    console.log("[API] /api/prescriptions POST payload prepared")

    const result = await col.insertOne(doc)
    console.log("[API] /api/prescriptions POST created", { insertedId: result.insertedId.toString() })
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    console.error("[API] /api/prescriptions POST error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}


