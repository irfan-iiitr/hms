"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Brain, 
  Pill, 
  BookOpen, 
  Mic, 
  Image as ImageIcon, 
  Calculator,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n"
import type {
  DifferentialDiagnosisResult,
  DrugInteractionResult,
  MedicalLiteratureSearch,
  MedicalImageAnalysis,
  ClinicalNotesProcessing,
  DosageCalculation,
} from "@/lib/types"

interface ClinicalToolsPanelProps {
  patientContext?: {
    age?: number
    gender?: string
    weight?: number
    medicalHistory?: string[]
    allergies?: string[]
    currentMedications?: string[]
  }
}

export function ClinicalToolsPanel({ patientContext }: ClinicalToolsPanelProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [aiAssistConfirmed, setAiAssistConfirmed] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clinical_tools_ai_confirmed")
      setAiAssistConfirmed(saved === "true")
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const updateAiConfirm = (value: boolean) => {
    setAiAssistConfirmed(value)
    try {
      window.localStorage.setItem("clinical_tools_ai_confirmed", String(value))
    } catch {
      // Ignore localStorage errors
    }
  }

  const ensureAiConfirm = () => {
    if (aiAssistConfirmed) return true
    toast({
      title: t("ct.confirmRequiredTitle", "Confirmation Required"),
      description: t(
        "ct.confirmRequiredDesc",
        "Please confirm AI clinical assistance acknowledgment before using these tools.",
      ),
      variant: "destructive",
    })
    return false
  }

  // Differential Diagnosis state
  const [symptoms, setSymptoms] = useState("")
  const [ddResult, setDdResult] = useState<DifferentialDiagnosisResult | null>(null)
  const [ddLoading, setDdLoading] = useState(false)

  // Drug Interaction state
  const [medications, setMedications] = useState("")
  const [diResult, setDiResult] = useState<DrugInteractionResult | null>(null)
  const [diLoading, setDiLoading] = useState(false)

  // Literature Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"research" | "guidelines" | "trials">("research")
  const [litResult, setLitResult] = useState<MedicalLiteratureSearch | null>(null)
  const [litLoading, setLitLoading] = useState(false)

  // Dosage Calculator state
  const [dosageMed, setDosageMed] = useState("")
  const [dosageAge, setDosageAge] = useState("")
  const [dosageWeight, setDosageWeight] = useState("")
  const [dosageIndication, setDosageIndication] = useState("")
  const [dosageResult, setDosageResult] = useState<DosageCalculation | null>(null)
  const [dosageLoading, setDosageLoading] = useState(false)
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null)
  const [doctorActions, setDoctorActions] = useState<Record<string, { decision: string; reason: string }>>({
    differential: { decision: "", reason: "" },
    interactions: { decision: "", reason: "" },
    literature: { decision: "", reason: "" },
    dosage: { decision: "", reason: "" },
  })

  // Differential Diagnosis
  const handleDifferentialDiagnosis = async () => {
    if (!ensureAiConfirm()) return
    if (!symptoms.trim()) {
      toast({
        title: t("common.error", "Error"),
        description: t("ct.error.symptoms", "Please enter symptoms"),
        variant: "destructive",
      })
      return
    }

    setDdLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/differential-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
          patientContext,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDdResult(data.data)
        toast({
          title: t("ct.toast.ddDone", "Analysis Complete"),
          description: t("ct.toast.ddDesc", "Differential diagnoses generated"),
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : "Failed to generate diagnosis",
        variant: "destructive",
      })
    } finally {
      setDdLoading(false)
    }
  }

  // Drug Interactions
  const handleDrugInteraction = async () => {
    if (!ensureAiConfirm()) return
    if (!medications.trim()) {
      toast({
        title: t("common.error", "Error"),
        description: t("ct.error.meds", "Please enter medications"),
        variant: "destructive",
      })
      return
    }

    setDiLoading(true)
    try {
      const medList = medications
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
        .map((name) => ({ name }))

      const response = await fetch("/api/clinical-tools/drug-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: medList,
          patientContext,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDiResult(data.data)
        toast({
          title: t("ct.toast.rxDone", "Check Complete"),
          description: data.data.hasInteractions
            ? t("ct.toast.rxInteractions", "Found {count} interaction(s)", {
                count: String(data.data.interactions.length),
              })
            : t("ct.toast.rxNone", "No interactions found"),
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : "Failed to check interactions",
        variant: "destructive",
      })
    } finally {
      setDiLoading(false)
    }
  }

  // Literature Search
  const handleLiteratureSearch = async () => {
    if (!ensureAiConfirm()) return
    if (!searchQuery.trim()) {
      toast({
        title: t("common.error", "Error"),
        description: t("ct.error.query", "Please enter search query"),
        variant: "destructive",
      })
      return
    }

    setLitLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/literature-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setLitResult(data.data)
        toast({
          title: t("ct.toast.litDone", "Search Complete"),
          description: t("ct.toast.litDesc", "Found {count} results", {
            count: String(data.data.results?.length || 0),
          }),
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : "Failed to search literature",
        variant: "destructive",
      })
    } finally {
      setLitLoading(false)
    }
  }

  // Dosage Calculator
  const handleDosageCalculation = async () => {
    if (!ensureAiConfirm()) return
    if (!dosageMed || !dosageAge || !dosageWeight || !dosageIndication) {
      toast({
        title: t("common.error", "Error"),
        description: t("ct.error.fields", "Please fill all fields"),
        variant: "destructive",
      })
      return
    }

    setDosageLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/calculate-dosage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication: dosageMed,
          patientFactors: {
            age: parseInt(dosageAge),
            weight: parseFloat(dosageWeight),
            indication: dosageIndication,
          },
          aiAssistConfirmed,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDosageResult(data.data)
        toast({
          title: t("ct.toast.doseDone", "Calculation Complete"),
          description: t("ct.toast.doseDesc", "Dosage recommendations generated"),
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : "Failed to calculate dosage",
        variant: "destructive",
      })
    } finally {
      setDosageLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white"
      case "high":
      case "major":
        return "bg-orange-500 text-white"
      case "moderate":
        return "bg-yellow-500 text-black"
      case "low":
      case "minor":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getConfidenceTone = (value: string) => {
    switch (value.toLowerCase()) {
      case "high":
        return "bg-green-600 text-white"
      case "moderate":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-orange-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const updateDoctorAction = (tool: string, patch: Partial<{ decision: string; reason: string }>) => {
    setDoctorActions((prev) => ({
      ...prev,
      [tool]: {
        decision: prev[tool]?.decision || "",
        reason: prev[tool]?.reason || "",
        ...patch,
      },
    }))
  }

  const saveDoctorAction = async (tool: "differential" | "interactions" | "literature" | "dosage", summary: string) => {
    const action = doctorActions[tool]
    if (!action?.decision) {
      toast({
        title: t("common.error", "Error"),
        description: t("ct.error.doctorAction", "Please select doctor action"),
        variant: "destructive",
      })
      return
    }

    setDecisionLoading(tool)
    try {
      const response = await fetch("/api/clinical-tools/doctor-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          decision: action.decision,
          reason: action.reason || undefined,
          summary,
          aiAssistConfirmed,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.message || "Failed to save decision")

      toast({ title: t("ct.saved", "Saved"), description: t("ct.savedDesc", "Doctor action logged successfully") })
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : "Failed to save doctor action",
        variant: "destructive",
      })
    } finally {
      setDecisionLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {t("ct.title", "AI-Powered Clinical Tools")}
          </CardTitle>
          <CardDescription>{t("ct.subtitle", "Advanced clinical decision support powered by AI")}</CardDescription>
          <p className="text-xs text-muted-foreground mt-2">
            {t(
              "ct.icmrNote",
              "Features here support principles in ICMR's AI ethics framework—clinician confirmation, explainability cues, and auditable doctor decisions—not a claim of formal compliance.",
            )}
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-emerald-500">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-2">
                <p>
                  {t(
                    "ct.aiAssistIntro",
                    "AI outputs are clinical decision support only and must be verified with professional judgment and current guidelines.",
                  )}
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={aiAssistConfirmed}
                    onChange={(e) => updateAiConfirm(e.target.checked)}
                  />
                  <span>
                    {t(
                      "ct.aiAssistCheckbox",
                      "I confirm I will use AI suggestions as assistive information, not as the sole basis for diagnosis or prescribing.",
                    )}
                  </span>
                </label>
              </div>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="differential" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="differential">{t("ct.tab.diagnosis", "Diagnosis")}</TabsTrigger>
              <TabsTrigger value="interactions">{t("ct.tab.interactions", "Interactions")}</TabsTrigger>
              <TabsTrigger value="literature">{t("ct.tab.literature", "Literature")}</TabsTrigger>
              <TabsTrigger value="dosage">{t("ct.tab.dosage", "Dosage")}</TabsTrigger>
            </TabsList>

            {/* Differential Diagnosis */}
            <TabsContent value="differential" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("ct.symptomsLabel", "Symptoms (comma-separated)")}</label>
                    <Input
                      placeholder={t("ct.symptomsPh", "e.g., Fever, Cough, Fatigue")}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                    <Button onClick={handleDifferentialDiagnosis} disabled={ddLoading} className="w-full">
                      {ddLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("ct.analyzing", "Analyzing...")}
                        </>
                      ) : (
                        t("ct.generateDD", "Generate Differential Diagnosis")
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {ddResult && (
                <div className="space-y-4 mt-4">
                  <Alert variant={ddResult.urgencyLevel === "Emergency" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t("ct.urgency", "Urgency:")}</strong> {ddResult.urgencyLevel}
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.aiConfidence", "AI Confidence & Rationale")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <strong>{t("ct.confidence", "Confidence")}:</strong>
                        <Badge className={getConfidenceTone(ddResult.differentialDiagnoses[0]?.probability || "Moderate")}>
                          {ddResult.differentialDiagnoses[0]?.probability || "Moderate"}
                        </Badge>
                      </div>
                      <p>
                        <strong>{t("ct.rationale", "Rationale")}:</strong>{" "}
                        {ddResult.differentialDiagnoses[0]?.reasoning ||
                          t("ct.ddRationaleFallback", "Based on symptom pattern and clinical context.")}
                      </p>
                    </CardContent>
                  </Card>

                  {ddResult.redFlags.length > 0 && (
                    <Card className="border-red-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">{t("ct.redFlags", "Red Flags")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {ddResult.redFlags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold">{t("ct.diffDxHeading", "Differential Diagnoses:")}</h4>
                    {ddResult.differentialDiagnoses.map((diagnosis, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{diagnosis.condition}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline">{diagnosis.probability}</Badge>
                              <Badge className={getRiskColor(diagnosis.severity)}>
                                {diagnosis.severity}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>{diagnosis.reasoning}</p>
                          {diagnosis.recommendedTests.length > 0 && (
                            <div>
                              <strong>{t("ct.recTests", "Recommended Tests")}:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {diagnosis.recommendedTests.map((test, j) => (
                                  <li key={j}>{test}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {ddResult.recommendedActions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("ct.recActions", "Recommended Actions")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {ddResult.recommendedActions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.doctorAction", "Doctor Action")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={doctorActions.differential?.decision || ""}
                        onValueChange={(value) => updateDoctorAction("differential", { decision: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("ct.selectAction", "Select action")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">{t("ct.accepted", "Accepted")}</SelectItem>
                          <SelectItem value="modified">{t("ct.modified", "Modified")}</SelectItem>
                          <SelectItem value="rejected">{t("ct.rejected", "Rejected")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t("ct.doctorActionPh", "Optional reason or clinical notes")}
                        value={doctorActions.differential?.reason || ""}
                        onChange={(e) => updateDoctorAction("differential", { reason: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={decisionLoading === "differential"}
                        onClick={() =>
                          saveDoctorAction(
                            "differential",
                            ddResult.differentialDiagnoses.map((d) => d.condition).slice(0, 3).join(", ")
                          )
                        }
                      >
                        {decisionLoading === "differential"
                          ? t("ct.saving", "Saving...")
                          : t("ct.saveDoctorAction", "Save Doctor Action")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Drug Interactions */}
            <TabsContent value="interactions" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("ct.medsLabel", "Medications (comma-separated)")}</label>
                    <Input
                      placeholder={t("ct.medsPh", "e.g., Aspirin, Warfarin, Lisinopril")}
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                    <Button onClick={handleDrugInteraction} disabled={diLoading} className="w-full">
                      {diLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("ct.checking", "Checking...")}
                        </>
                      ) : (
                        t("ct.checkInteractions", "Check Drug Interactions")
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {diResult && (
                <div className="space-y-4 mt-4">
                  <Alert variant={diResult.overallRisk === "Critical" || diResult.overallRisk === "High" ? "destructive" : "default"}>
                    <AlertDescription>
                      <strong>{t("ct.overallRiskLabel", "Overall Risk:")}</strong> {diResult.overallRisk}
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.aiConfidence", "AI Confidence & Rationale")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <strong>{t("ct.confidence", "Confidence")}:</strong>
                        <Badge className={getConfidenceTone(diResult.hasInteractions ? "High" : "Moderate")}>
                          {diResult.hasInteractions ? "High" : "Moderate"}
                        </Badge>
                      </div>
                      <p>
                        <strong>{t("ct.rationale", "Rationale")}:</strong>{" "}
                        {diResult.interactions[0]?.description ||
                          t("ct.interRationaleFallback", "No major interaction evidence detected in this check.")}
                      </p>
                    </CardContent>
                  </Card>

                  {diResult.hasInteractions ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">{t("ct.detectedInteractions", "Detected Interactions")}:</h4>
                      {diResult.interactions.map((interaction, i) => (
                        <Card key={i} className="border-orange-500">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm">
                                {interaction.medications.join(" + ")}
                              </CardTitle>
                              <Badge className={getRiskColor(interaction.severity)}>
                                {interaction.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>
                              <strong>{t("ct.descLabel", "Description:")}</strong> {interaction.description}
                            </p>
                            <p>
                              <strong>{t("ct.recLabel", "Recommendation:")}</strong> {interaction.recommendation}
                            </p>
                            {interaction.alternatives.length > 0 && (
                              <div>
                                <strong>{t("ct.alternatives", "Alternatives")}:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {interaction.alternatives.map((alt, j) => (
                                    <li key={j}>{alt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{t("ct.noInteractions", "No significant interactions detected")}</AlertDescription>
                    </Alert>
                  )}

                  {diResult.dosageWarnings.length > 0 && (
                    <Card className="border-yellow-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("ct.dosageWarnings", "Dosage Warnings")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {diResult.dosageWarnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {diResult.patientSpecificWarnings.length > 0 && (
                    <Card className="border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("ct.patientWarnings", "Patient-Specific Warnings")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {diResult.patientSpecificWarnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.doctorAction", "Doctor Action")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={doctorActions.interactions?.decision || ""}
                        onValueChange={(value) => updateDoctorAction("interactions", { decision: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("ct.selectAction", "Select action")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">{t("ct.accepted", "Accepted")}</SelectItem>
                          <SelectItem value="modified">{t("ct.modified", "Modified")}</SelectItem>
                          <SelectItem value="rejected">{t("ct.rejected", "Rejected")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t("ct.doctorActionPh", "Optional reason or clinical notes")}
                        value={doctorActions.interactions?.reason || ""}
                        onChange={(e) => updateDoctorAction("interactions", { reason: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={decisionLoading === "interactions"}
                        onClick={() =>
                          saveDoctorAction(
                            "interactions",
                            diResult.interactions.map((i) => i.medications.join(" + ")).slice(0, 3).join(", ")
                          )
                        }
                      >
                        {decisionLoading === "interactions"
                          ? t("ct.saving", "Saving...")
                          : t("ct.saveDoctorAction", "Save Doctor Action")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Literature Search */}
            <TabsContent value="literature" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("ct.litQueryLabel", "Search Query")}</label>
                    <Input
                      placeholder={t("ct.litQueryPh", "e.g., Treatment for type 2 diabetes")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant={searchType === "research" ? "default" : "outline"}
                        onClick={() => setSearchType("research")}
                        size="sm"
                      >
                        {t("ct.litResearch", "Research")}
                      </Button>
                      <Button
                        variant={searchType === "guidelines" ? "default" : "outline"}
                        onClick={() => setSearchType("guidelines")}
                        size="sm"
                      >
                        {t("ct.litGuidelines", "Guidelines")}
                      </Button>
                      <Button
                        variant={searchType === "trials" ? "default" : "outline"}
                        onClick={() => setSearchType("trials")}
                        size="sm"
                      >
                        {t("ct.litTrials", "Trials")}
                      </Button>
                    </div>
                    <Button onClick={handleLiteratureSearch} disabled={litLoading} className="w-full">
                      {litLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("ct.searching", "Searching...")}
                        </>
                      ) : (
                        t("ct.searchLit", "Search Literature")
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {litResult && (
                <div className="space-y-3 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.aiConfidence", "AI Confidence & Rationale")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <strong>{t("ct.confidence", "Confidence")}:</strong>
                        <Badge className={getConfidenceTone(litResult.results[0]?.relevance || "Moderate")}>
                          {litResult.results[0]?.relevance || "Moderate"}
                        </Badge>
                      </div>
                      <p>
                        <strong>{t("ct.rationale", "Rationale")}:</strong>{" "}
                        {litResult.results[0]?.summary ||
                          t("ct.litRationaleFallback", "Based on relevance-ranked literature search results.")}
                      </p>
                    </CardContent>
                  </Card>

                  <h4 className="font-semibold">
                    {t("ct.resultsHeading", "Results ({count}):", { count: String(litResult.totalResults) })}
                  </h4>
                  {litResult.results.map((result, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{result.title}</CardTitle>
                          <Badge variant="outline">{result.year}</Badge>
                        </div>
                        <CardDescription>{result.source}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>{result.summary}</p>
                        {result.keyPoints && result.keyPoints.length > 0 && (
                          <div>
                            <strong>{t("ct.keyPoints", "Key Points")}:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {result.keyPoints.map((point, j) => (
                                <li key={j}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Badge className={getRiskColor(result.relevance)}>
                          {t("ct.relevanceLabel", "Relevance: {rel}", { rel: result.relevance })}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.doctorAction", "Doctor Action")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={doctorActions.literature?.decision || ""}
                        onValueChange={(value) => updateDoctorAction("literature", { decision: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("ct.selectAction", "Select action")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">{t("ct.accepted", "Accepted")}</SelectItem>
                          <SelectItem value="modified">{t("ct.modified", "Modified")}</SelectItem>
                          <SelectItem value="rejected">{t("ct.rejected", "Rejected")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t("ct.doctorActionPh", "Optional reason or clinical notes")}
                        value={doctorActions.literature?.reason || ""}
                        onChange={(e) => updateDoctorAction("literature", { reason: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={decisionLoading === "literature"}
                        onClick={() =>
                          saveDoctorAction(
                            "literature",
                            litResult.results.map((r) => r.title).slice(0, 3).join(", ")
                          )
                        }
                      >
                        {decisionLoading === "literature"
                          ? t("ct.saving", "Saving...")
                          : t("ct.saveDoctorAction", "Save Doctor Action")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Dosage Calculator */}
            <TabsContent value="dosage" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">{t("ct.medName", "Medication Name")}</label>
                      <Input
                        placeholder={t("ct.medPh", "e.g., Amoxicillin")}
                        value={dosageMed}
                        onChange={(e) => setDosageMed(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">{t("ct.age", "Age (years)")}</label>
                        <Input
                          type="number"
                          placeholder={t("ct.agePh", "Age")}
                          value={dosageAge}
                          onChange={(e) => setDosageAge(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("ct.weight", "Weight (kg)")}</label>
                        <Input
                          type="number"
                          placeholder={t("ct.weightPh", "Weight")}
                          value={dosageWeight}
                          onChange={(e) => setDosageWeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("ct.indication", "Indication")}</label>
                      <Input
                        placeholder={t("ct.indicationPh", "e.g., Bacterial infection")}
                        value={dosageIndication}
                        onChange={(e) => setDosageIndication(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleDosageCalculation} disabled={dosageLoading} className="w-full">
                      {dosageLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("ct.calculating", "Calculating...")}
                        </>
                      ) : (
                        t("ct.calcDosage", "Calculate Dosage")
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {dosageLoading && (
                <Card className="border-emerald-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("ct.webRefs", "Web Dosage References")}</CardTitle>
                    <CardDescription>{t("ct.webRefsSearching", "Searching web for company, dosage, and order links...")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              )}

              {dosageResult && (
                <div className="space-y-3 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.aiConfidence", "AI Confidence & Rationale")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <strong>{t("ct.confidence", "Confidence")}:</strong>
                        <Badge className={getConfidenceTone(dosageResult.webSearchResults?.length ? "High" : "Moderate")}>
                          {dosageResult.webSearchResults?.length ? "High" : "Moderate"}
                        </Badge>
                      </div>
                      <p>
                        <strong>{t("ct.rationale", "Rationale")}:</strong>{" "}
                        {t(
                          "ct.dosageAiRationale",
                          "Dosage recommendation combines patient age/weight/indication with model inference and available safety warnings.",
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.dosageRec", "Dosage Recommendations")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>{t("ct.standardDose", "Standard Dosage")}:</strong> {dosageResult.standardDosage}
                      </div>
                      <div>
                        <strong>{t("ct.adjustedDose", "Adjusted Dosage")}:</strong> {dosageResult.adjustedDosage}
                      </div>
                      <div>
                        <strong>{t("ct.frequency", "Frequency")}:</strong> {dosageResult.frequency}
                      </div>
                      {dosageResult.route && (
                        <div>
                          <strong>{t("ct.route", "Route")}:</strong> {dosageResult.route}
                        </div>
                      )}
                      {dosageResult.duration && (
                        <div>
                          <strong>{t("ct.duration", "Duration")}:</strong> {dosageResult.duration}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {dosageResult.warnings.length > 0 && (
                    <Card className="border-red-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">{t("ct.warnings", "Warnings")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {dosageResult.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {dosageResult.monitoring.length > 0 && (
                    <Card className="border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("ct.monitoring", "Monitoring Parameters")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {dosageResult.monitoring.map((param, i) => (
                            <li key={i}>{param}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {dosageResult.disclaimer && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        {dosageResult.disclaimer}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card className="border-emerald-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.webRefs", "Web Dosage References")}</CardTitle>
                      <CardDescription>
                        {dosageResult.webSearchSummary || t("ct.webSkipped", "Web search was skipped because structured dosage was already available.")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {dosageResult.webSearchResults?.length ? (
                        dosageResult.webSearchResults.map((item, index) => (
                          <div key={`${item.orderLink}-${index}`} className="rounded-md border p-3">
                            <div>
                              <strong>{t("ct.company", "Company")}:</strong> {item.companyName}
                            </div>
                            <div>
                              <strong>{t("ct.tab.dosage", "Dosage")}:</strong> {item.dosage}
                            </div>
                            <a
                              href={item.orderLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {t("ct.orderLink", "Order / Source Link")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">{t("ct.webNoRefs", "No web dosage references found.")}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {t(
                        "ct.dosagePrecaution",
                        "Precaution: Verify allergy status, renal/hepatic function, pregnancy/lactation status, and medicine label instructions before finalizing any dosage or order recommendation.",
                      )}
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("ct.doctorAction", "Doctor Action")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={doctorActions.dosage?.decision || ""}
                        onValueChange={(value) => updateDoctorAction("dosage", { decision: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("ct.selectAction", "Select action")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">{t("ct.accepted", "Accepted")}</SelectItem>
                          <SelectItem value="modified">{t("ct.modified", "Modified")}</SelectItem>
                          <SelectItem value="rejected">{t("ct.rejected", "Rejected")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t("ct.doctorActionPh", "Optional reason or clinical notes")}
                        value={doctorActions.dosage?.reason || ""}
                        onChange={(e) => updateDoctorAction("dosage", { reason: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={decisionLoading === "dosage"}
                        onClick={() => saveDoctorAction("dosage", `${dosageResult.adjustedDosage} | ${dosageResult.frequency}`)}
                      >
                        {decisionLoading === "dosage"
                          ? t("ct.saving", "Saving...")
                          : t("ct.saveDoctorAction", "Save Doctor Action")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>{t("ct.disclaimerStrong", "Clinical Decision Support Disclaimer:")}</strong>{" "}
          {t("ct.disclaimerBody", "...")}
        </AlertDescription>
      </Alert>
    </div>
  )
}
