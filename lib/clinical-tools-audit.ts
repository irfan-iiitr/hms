import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"

export type ClinicalToolAuditRecord = {
  _id?: ObjectId
  tool: "dosage-calculator" | "doctor-action"
  status: "success" | "error" | "validation_error"
  createdAt: Date
  requestMeta: {
    medication?: string
    age?: number
    weight?: number
    indication?: string
    aiAssistConfirmed?: boolean
  }
  responseMeta?: {
    hasWebSearchResults?: boolean
    webSearchResultCount?: number
    webSearchSummary?: string
  }
  errorMessage?: string
}

export async function writeClinicalToolAudit(record: ClinicalToolAuditRecord) {
  try {
    const collection = await getCollection<ClinicalToolAuditRecord>("clinical_tool_audit_logs")
    await collection.insertOne(record)
  } catch (error) {
    // Best-effort logging only; never break API flow.
    logger.warn("[Clinical Tool Audit] Failed to write audit log", {
      tool: record.tool,
      status: record.status,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
