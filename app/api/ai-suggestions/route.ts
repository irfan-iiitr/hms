import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/db"
import { generateAIPrescriptionSuggestions, generateMedicalAnalysis } from "@/lib/ai-utils"

export const runtime = "nodejs"

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function pick<T extends object>(obj: T | null | undefined, keys: (keyof T)[]) {
  const out: Partial<T> = {}
  if (!obj) return out
  for (const k of keys) (out as any)[k] = (obj as any)[k]
  return out
}

async function buildPatientContext(patientId: string) {
  // Load patient profile
  const users = await getCollection("users")
  const recordsCol = await getCollection("medical_records")
  const rxCol = await getCollection("prescriptions")

  let patient: any = null
  try {
    const oid = new ObjectId(patientId)
    patient = await users.findOne({ _id: oid })
  } catch {
    // fallback in case id is not ObjectId (unlikely in this app)
    patient = await users.findOne({ id: patientId })
  }

  const [records, prescriptions] = await Promise.all([
    recordsCol.find({ patientId }).sort({ date: -1 }).limit(10).toArray(),
    rxCol.find({ patientId }).sort({ issuedDate: -1 }).limit(10).toArray(),
  ])

  const profile = pick(patient, [
    "name",
    "email",
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "allergies",
    "medicalHistory",
  ] as any)

  const context = {
    profile,
    medicalFilesInformation: Array.isArray(patient?.medicalFilesInformation)
      ? patient.medicalFilesInformation.slice(-5)
      : [],
    recentRecords: records.map((r: any) => pick(r, ["date", "diagnosis", "symptoms", "notes"] as any)),
    recentPrescriptions: prescriptions.map((p: any) => pick(p, [
      "issuedDate",
      "medications",
      "notes",
    ] as any)),
  }

  return { patient, context }
}

function composePrompt(context: any, condition: string, diagnosis?: string, symptoms?: string[], notes?: string) {
  const lines: string[] = []
  lines.push("You are a clinical decision support assistant."
    + " Provide evidence-informed suggestions, typical dosages, and cautions."
    + " Always include safety notes and advise verification with clinical guidelines.")
  lines.push("")
  lines.push("Patient summary:")
  lines.push(`- Name: ${context?.profile?.name || "(hidden)"}`)
  if (context?.profile?.gender) lines.push(`- Gender: ${context.profile.gender}`)
  if (context?.profile?.dateOfBirth) lines.push(`- DOB: ${new Date(context.profile.dateOfBirth).toLocaleDateString()}`)
  if (context?.profile?.bloodGroup) lines.push(`- Blood group: ${context.profile.bloodGroup}`)
  if (Array.isArray(context?.profile?.allergies) && context.profile.allergies.length)
    lines.push(`- Allergies: ${context.profile.allergies.join(", ")}`)
  if (Array.isArray(context?.profile?.medicalHistory) && context.profile.medicalHistory.length)
    lines.push(`- Medical history: ${context.profile.medicalHistory.join(", ")}`)

  if (Array.isArray(context?.recentRecords) && context.recentRecords.length) {
    lines.push("")
    lines.push("Recent records (latest first):")
    for (const r of context.recentRecords.slice(0, 5)) {
      lines.push(`• ${new Date(r.date).toLocaleDateString()}: ${r.diagnosis} — symptoms: ${(r.symptoms||[]).join(", ")}`)
      if (r.notes) lines.push(`  notes: ${r.notes}`)
    }
  }

  if (Array.isArray(context?.recentPrescriptions) && context.recentPrescriptions.length) {
    lines.push("")
    lines.push("Recent prescriptions:")
    for (const p of context.recentPrescriptions.slice(0, 5)) {
      const meds = Array.isArray(p.medications) ? p.medications.map((m: any) => m.name).join(", ") : "(n/a)"
      lines.push(`• ${new Date(p.issuedDate).toLocaleDateString()}: ${meds}`)
    }
  }

  lines.push("")
  lines.push("Current visit:")
  if (diagnosis) lines.push(`- Working diagnosis: ${diagnosis}`)
  if (Array.isArray(symptoms) && symptoms.length) lines.push(`- Symptoms: ${symptoms.join(", ")}`)
  if (condition) lines.push(`- Chief complaint: ${condition}`)
  if (notes) lines.push(`- Notes: ${notes}`)

  lines.push("")
  lines.push("Task: Suggest an initial treatment plan with:")
  lines.push("1) likely causes and differentials")
  lines.push("2) medication options with typical adult dosages and frequency")
  lines.push("3) non-pharmacological advice")
  lines.push("4) monitoring and follow-up")
  lines.push("5) red flags and contraindications")

  return lines.join("\n")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const { patientId, condition = "", diagnosis = "", symptoms = [], notes = "", messages = [] } = body || {}

    if (!patientId) {
      return NextResponse.json({ success: false, message: "patientId is required" }, { status: 400 })
    }

    const { context } = await buildPatientContext(patientId)

    // If chat messages are provided, generate a conversational reply (mocked)
    if (Array.isArray(messages) && messages.length) {
      const lastUser = [...messages].reverse().find((m: ChatMessage) => m.role === "user")
      const reply = `Considering the patient's profile and records, here's guidance:\n\n` +
        (await generateMedicalAnalysis(diagnosis || condition, symptoms || [], (lastUser?.content || notes || "").slice(0, 1200))) +
        "\n\nAlways verify dosing and cautions based on local guidelines and the patient's allergies/comorbidities."

      const assistant: ChatMessage = { role: "assistant", content: reply }
      return NextResponse.json({ success: true, message: assistant })
    }

    // Initial suggestions flow
    const prompt = composePrompt(context, condition, diagnosis, symptoms, notes)
    console.log("[AI Suggestions] prompt preview:\n" + prompt.substring(0, 400))

    // Use mock generators to simulate LLM response
    const base = await generateAIPrescriptionSuggestions(diagnosis || condition, Array.isArray(symptoms) ? symptoms : [])
    const analysis = await generateMedicalAnalysis(diagnosis || condition, Array.isArray(symptoms) ? symptoms : [], notes || "")

    const suggestions = `${base}\n\n---\n\nContext-aware considerations based on patient data:\n\n${analysis}`

    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    console.error("/api/ai-suggestions error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}
