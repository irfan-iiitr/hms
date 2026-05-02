import { NextResponse, type NextRequest } from "next/server"
import { calculateDosage } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"
import { writeClinicalToolAudit } from "@/lib/clinical-tools-audit"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/calculate-dosage
 * Calculate medication dosage based on patient factors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medication, patientFactors, aiAssistConfirmed } = body

    if (!medication || typeof medication !== "string") {
      await writeClinicalToolAudit({
        tool: "dosage-calculator",
        status: "validation_error",
        createdAt: new Date(),
        requestMeta: {
          medication: typeof medication === "string" ? medication : undefined,
          aiAssistConfirmed: Boolean(aiAssistConfirmed),
        },
        errorMessage: "Medication name is required",
      })
      return NextResponse.json(
        { success: false, message: "Medication name is required" },
        { status: 400 }
      )
    }

    if (!patientFactors || !patientFactors.age || !patientFactors.weight || !patientFactors.indication) {
      await writeClinicalToolAudit({
        tool: "dosage-calculator",
        status: "validation_error",
        createdAt: new Date(),
        requestMeta: {
          medication,
          age: patientFactors?.age,
          weight: patientFactors?.weight,
          indication: patientFactors?.indication,
          aiAssistConfirmed: Boolean(aiAssistConfirmed),
        },
        errorMessage: "Patient factors (age, weight, indication) are required",
      })
      return NextResponse.json(
        { success: false, message: "Patient factors (age, weight, indication) are required" },
        { status: 400 }
      )
    }

    logger.info("[Dosage Calculator] Calculating dosage", {
      medication,
      age: patientFactors.age,
      weight: patientFactors.weight,
      aiAssistConfirmed: Boolean(aiAssistConfirmed),
    })

    if (!aiAssistConfirmed) {
      logger.warn("[Dosage Calculator] Request without UI AI-assist confirmation", {
        medication,
      })
    }

    const result = await calculateDosage(medication, patientFactors)

    logger.info("[Dosage Calculator] Calculation complete")

    await writeClinicalToolAudit({
      tool: "dosage-calculator",
      status: "success",
      createdAt: new Date(),
      requestMeta: {
        medication,
        age: patientFactors.age,
        weight: patientFactors.weight,
        indication: patientFactors.indication,
        aiAssistConfirmed: Boolean(aiAssistConfirmed),
      },
      responseMeta: {
        hasWebSearchResults: Array.isArray(result?.webSearchResults) && result.webSearchResults.length > 0,
        webSearchResultCount: Array.isArray(result?.webSearchResults) ? result.webSearchResults.length : 0,
        webSearchSummary: result?.webSearchSummary,
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Dosage Calculator] Error", error)
    await writeClinicalToolAudit({
      tool: "dosage-calculator",
      status: "error",
      createdAt: new Date(),
      requestMeta: {
        aiAssistConfirmed: false,
      },
      errorMessage: error instanceof Error ? error.message : "Failed to calculate dosage",
    })
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate dosage",
      },
      { status: 500 }
    )
  }
}
