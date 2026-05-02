import { NextResponse, type NextRequest } from "next/server"
import { writeClinicalToolAudit } from "@/lib/clinical-tools-audit"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

type ToolName = "differential" | "interactions" | "literature" | "dosage"
type DecisionName = "accepted" | "modified" | "rejected"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const tool = body?.tool as ToolName
    const decision = body?.decision as DecisionName
    const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
    const summary = typeof body?.summary === "string" ? body.summary.trim() : ""
    const aiAssistConfirmed = Boolean(body?.aiAssistConfirmed)

    if (!tool || !["differential", "interactions", "literature", "dosage"].includes(tool)) {
      return NextResponse.json({ success: false, message: "Invalid tool" }, { status: 400 })
    }

    if (!decision || !["accepted", "modified", "rejected"].includes(decision)) {
      return NextResponse.json({ success: false, message: "Invalid decision" }, { status: 400 })
    }

    await writeClinicalToolAudit({
      tool: "doctor-action",
      status: "success",
      createdAt: new Date(),
      requestMeta: {
        indication: `${tool}:${decision}`,
        aiAssistConfirmed,
      },
      responseMeta: {
        webSearchSummary: `doctor_action|summary:${summary}|reason:${reason || "none"}`,
      },
    })

    logger.info("[Clinical Tool] Doctor action captured", {
      tool,
      decision,
      hasReason: Boolean(reason),
      aiAssistConfirmed,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[Clinical Tool] Failed to save doctor action", error)
    return NextResponse.json({ success: false, message: "Failed to save doctor action" }, { status: 500 })
  }
}
