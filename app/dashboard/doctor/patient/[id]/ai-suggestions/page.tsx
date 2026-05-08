"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Brain,
  Check,
  ClipboardPlus,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  Pill,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User as UserIcon,
} from "lucide-react"

import { ProtectedRoute } from "@/components/protected-route"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { fetchMedicalRecordsByPatient, fetchPrescriptionsByPatient } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const Markdown: any = ReactMarkdown

type ChatMessage = { role: "user" | "assistant"; content: string }

type PatientContext = {
  _id?: string
  id?: string
  name?: string
  email?: string
  gender?: string
  dateOfBirth?: string
  bloodGroup?: string
  allergies?: string[]
  medicalHistory?: string[]
  medicalFilesInformation?: Array<{
    summary?: string
    aiSummary?: string
    details?: any
    keyFindings?: string[]
    uploadedAt?: string
    uploadDate?: string
    originalFileName?: string
    category?: string
    url?: string
  }>
}

function formatDate(value?: string | Date) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()
}

function calculateAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null
  const date = new Date(dateOfBirth)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function summarizeRecord(record: any) {
  const symptoms = Array.isArray(record?.symptoms) && record.symptoms.length ? record.symptoms.join(", ") : "No symptoms recorded"
  return `${record?.diagnosis || "Visit record"} • ${symptoms}`
}

function summarizePrescription(rx: any) {
  const medications = Array.isArray(rx?.medications) && rx.medications.length
    ? rx.medications.map((med: any) => [med?.name, med?.dosage].filter(Boolean).join(" ")).join(", ")
    : "No medications recorded"
  return medications
}

export default function AISuggestionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const handoffStorageKey = `ai-suggestions-draft:${patientId}`

  const [diagnosis, setDiagnosis] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [condition, setCondition] = useState("")
  const [notes, setNotes] = useState("")

  const [suggestions, setSuggestions] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState("")
  const [patient, setPatient] = useState<PatientContext | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [contextLoading, setContextLoading] = useState(true)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, chatLoading])

  useEffect(() => {
    let ignore = false

    const loadContext = async () => {
      setContextLoading(true)
      try {
        const [patientRes, recordItems, prescriptionItems] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(patientId)}`, { cache: "no-store" }),
          fetchMedicalRecordsByPatient(patientId),
          fetchPrescriptionsByPatient(patientId),
        ])

        const patientData = await patientRes.json().catch(() => null)

        if (ignore) return

        if (patientRes.ok && patientData?.success && patientData?.user) {
          setPatient(patientData.user)
        }

        setRecords(recordItems)
        setPrescriptions(prescriptionItems)

        if (recordItems[0]) {
          setDiagnosis((prev) => prev || recordItems[0]?.diagnosis || "")
          setSymptoms((prev) => prev || (Array.isArray(recordItems[0]?.symptoms) ? recordItems[0].symptoms.join(", ") : ""))
          setNotes((prev) => prev || recordItems[0]?.notes || "")
        }
      } catch (loadError) {
        console.error("Failed to load AI suggestions context", loadError)
        if (!ignore) {
          setError("Failed to load patient context")
        }
      } finally {
        if (!ignore) setContextLoading(false)
      }
    }

    const loadHistory = async () => {
      try {
        const doctorId = user?.id || (user as any)?._id || ""
        if (!doctorId) return

        const res = await fetch(
          `/api/ai-chats?patientId=${encodeURIComponent(patientId)}&doctorId=${encodeURIComponent(doctorId)}`,
          { cache: "no-store" }
        )
        const data = await res.json()
        if (!ignore && data?.success && Array.isArray(data?.item?.messages)) {
          setMessages(data.item.messages)
          const firstAssistant = data.item.messages.find((msg: ChatMessage) => msg.role === "assistant")
          if (firstAssistant?.content) {
            setSuggestions(firstAssistant.content)
          }
        }
      } catch (historyError) {
        console.warn("Failed to load chat history", historyError)
      }
    }

    loadContext()
    if (user?.role === "doctor" || user?.role === "admin") {
      loadHistory()
    }

    return () => {
      ignore = true
    }
  }, [patientId, user?.id, user?.role])

  const patientAge = useMemo(() => calculateAge(patient?.dateOfBirth), [patient?.dateOfBirth])
  const allergies = Array.isArray(patient?.allergies) ? patient!.allergies! : []
  const medicalHistory = Array.isArray(patient?.medicalHistory) ? patient!.medicalHistory! : []
  const medicalFiles = Array.isArray(patient?.medicalFilesInformation) ? patient!.medicalFilesInformation! : []

  const persistChat = async (items: ChatMessage[]) => {
    const doctorId = user?.id || (user as any)?._id || ""
    if (!doctorId) return

    try {
      await fetch("/api/ai-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, doctorId, messages: items }),
      })
    } catch (persistError) {
      console.warn("Persist chat failed", persistError)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestions)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (copyError) {
      console.error("Copy failed", copyError)
    }
  }

  const handleUseSuggestions = () => {
    if (!suggestions.trim()) return

    try {
      sessionStorage.setItem(
        handoffStorageKey,
        JSON.stringify({
          diagnosis: diagnosis.trim(),
          symptoms: symptoms.trim(),
          notes: notes.trim(),
          aiPlan: suggestions.trim(),
          createdAt: Date.now(),
        })
      )
    } catch (storageError) {
      console.warn("Failed to persist AI suggestion draft", storageError)
    }

    router.push(`/dashboard/doctor/patient/${patientId}?openRecordForm=1&prefillFromAi=1`)
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          condition,
          diagnosis,
          symptoms: symptoms.split(",").map((value) => value.trim()).filter(Boolean),
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to generate suggestions")
      }

      const nextSuggestions = data?.suggestions || ""
      const seededMessages: ChatMessage[] = [{ role: "assistant", content: nextSuggestions }]

      setSuggestions(nextSuggestions)
      setMessages(seededMessages)
      await persistChat(seededMessages)

      toast({
        title: "Suggestions ready",
        description: "History-aware guidance has been generated for this patient.",
      })
    } catch (generateError: any) {
      console.error("AI suggestions error", generateError)
      setError(generateError?.message || "Failed to generate suggestions")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text || !suggestions || chatLoading) return

    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextHistory)
    setChatInput("")
    setChatLoading(true)
    setError("")

    try {
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, messages: nextHistory }),
      })

      const data = await res.json()
      if (!res.ok || !data?.success || !data?.message) {
        throw new Error(data?.message || "Chat failed")
      }

      const updated = [...nextHistory, data.message as ChatMessage]
      setMessages(updated)
      await persistChat(updated)
    } catch (chatError: any) {
      console.error("AI chat error", chatError)
      setError(chatError?.message || t("aiAssistPage.chatFailed"))
      setMessages(messages)
    } finally {
      setChatLoading(false)
    }
  }

  const quickPrompts = [
    "How should past history change the current treatment plan?",
    "What contraindications should I watch for before prescribing?",
    "Which follow-up tests or monitoring steps matter most now?",
  ]

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background via-background to-muted/70">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Link href={`/dashboard/doctor/patient/${patientId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>{t("docPatient.aiTreatmentTitle")}</span>
                </div>
                <h1 className="text-3xl font-bold text-balance">AI Suggestions Workspace</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Review allergies, prior records, uploaded file summaries, and prescription history before generating the next plan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="min-w-28">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Records</p>
                  <p className="text-2xl font-semibold">{records.length}</p>
                </CardContent>
              </Card>
              <Card className="min-w-28">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Prescriptions</p>
                  <p className="text-2xl font-semibold">{prescriptions.length}</p>
                </CardContent>
              </Card>
              <Card className="min-w-28">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Allergies</p>
                  <p className="text-2xl font-semibold">{allergies.length}</p>
                </CardContent>
              </Card>
              <Card className="min-w-28">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Files</p>
                  <p className="text-2xl font-semibold">{medicalFiles.length}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {t("aiAssistPage.disclaimerAlert")}
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert className="mb-6 border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
            <div className="space-y-6">
              <Card className="border-primary/15 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Patient Snapshot
                  </CardTitle>
                  <CardDescription>
                    Core patient context that should influence the current assessment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contextLoading ? (
                    <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading patient context...
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoBlock label="Patient" value={patient?.name || "—"} />
                        <InfoBlock label="Age / Gender" value={patientAge ? `${patientAge} yrs${patient?.gender ? ` • ${patient.gender}` : ""}` : patient?.gender || "—"} />
                        <InfoBlock label="Blood Group" value={patient?.bloodGroup || "—"} />
                        <InfoBlock label="Email" value={patient?.email || "—"} />
                      </div>

                      <SectionBlock
                        title="Allergies"
                        icon={<ShieldAlert className="h-4 w-4 text-amber-600" />}
                        empty="No allergies recorded"
                        items={allergies}
                        tone={allergies.length ? "warning" : "neutral"}
                      />

                      <SectionBlock
                        title="Past Medical History"
                        icon={<Stethoscope className="h-4 w-4 text-primary" />}
                        empty="No medical history recorded"
                        items={medicalHistory}
                        tone="neutral"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-primary" />
                    Current Visit Inputs
                  </CardTitle>
                  <CardDescription>
                    These details are sent together with prior history and uploaded file summaries.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("aiAssistPage.workingDiagnosis")}</label>
                      <Input
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder={t("docPatient.diagnosisPh")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("mr.symptomsLabel")}</label>
                      <Input
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder={t("docPatient.symptomsPh")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("aiAssistPage.chiefComplaint")}</label>
                      <Textarea
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        placeholder={t("aiAssistPage.chiefComplaintPh")}
                        className="min-h-24"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("aiAssistPage.additionalNotesOpt")}</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("aiAssistPage.additionalNotesPh")}
                        className="min-h-28"
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loading ? t("aiAssistPage.generating") : t("aiAssistPage.generateSuggestions")}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Uploaded Medical Files
                  </CardTitle>
                  <CardDescription>
                    AI-extracted file summaries that may change the current recommendation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No uploaded medical files available for this patient.</p>
                  ) : (
                    <div className="space-y-3">
                      {medicalFiles.slice(0, 5).map((file, index) => {
                        const summary = file.summary || file.aiSummary || "No summary available"
                        const keyFindings = Array.isArray(file.keyFindings)
                          ? file.keyFindings
                          : Array.isArray(file.details?.key_findings)
                            ? file.details.key_findings
                            : []

                        return (
                          <div key={`${file.originalFileName || "file"}-${index}`} className="rounded-xl border bg-muted/20 p-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium">{file.originalFileName || `Uploaded file ${index + 1}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(file.uploadedAt || file.uploadDate)}
                                </p>
                              </div>
                              {file.category ? <Badge variant="secondary">{file.category.replace(/_/g, " ")}</Badge> : null}
                            </div>
                            <p className="text-sm leading-6 text-foreground/90">{summary}</p>
                            {keyFindings.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {keyFindings.slice(0, 6).map((finding: string, itemIndex: number) => (
                                  <Badge key={`${finding}-${itemIndex}`} variant="outline" className="bg-background">
                                    {finding}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/15 shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Suggested Plan
                    </CardTitle>
                    <CardDescription>
                      Output is generated using the current visit details plus the patient’s history, allergies, files, and recent prescriptions.
                    </CardDescription>
                  </div>
                  {suggestions ? (
                    <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2 bg-transparent">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t("aiAssistPage.copied") : t("aiAssistPage.copy")}
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex min-h-80 items-center justify-center">
                      <div className="space-y-3 text-center">
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{t("aiAssistPage.generatingWait")}</p>
                      </div>
                    </div>
                  ) : suggestions ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border bg-background p-5">
                        <div className="prose max-w-none text-sm dark:prose-invert">
                          <Markdown remarkPlugins={[remarkGfm as any]}>{suggestions}</Markdown>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Button className="w-full gap-2" onClick={handleUseSuggestions}>
                          <ClipboardPlus className="h-4 w-4" />
                          {t("aiAssistPage.useSuggestions")}
                        </Button>
                        <Link href={`/dashboard/doctor/patient/${patientId}`}>
                          <Button variant="outline" className="w-full bg-transparent">
                            {t("aiAssistPage.backToPatient")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center">
                      <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
                      <p className="font-medium">No suggestions generated yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">{t("aiAssistPage.fillPanelHint")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      Recent Records
                    </CardTitle>
                    <CardDescription>Latest clinical notes and diagnoses for context.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {records.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No prior records found.</p>
                    ) : (
                      <div className="space-y-3">
                        {records.slice(0, 4).map((record) => (
                          <div key={record.id || record._id} className="rounded-xl border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="font-medium">{record.diagnosis || "Visit record"}</p>
                              <Badge variant="outline">{formatDate(record.date)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{summarizeRecord(record)}</p>
                            {record.notes ? <p className="mt-2 text-sm leading-6">{record.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Pill className="h-5 w-5 text-primary" />
                      Recent Prescriptions
                    </CardTitle>
                    <CardDescription>Medication history to check duplications and interactions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prescriptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No prescription history found.</p>
                    ) : (
                      <div className="space-y-3">
                        {prescriptions.slice(0, 4).map((rx) => (
                          <div key={rx.id || rx._id} className="rounded-xl border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="font-medium">{formatDate(rx.issuedDate)}</p>
                              <Badge variant="outline">{Array.isArray(rx.medications) ? rx.medications.length : 0} meds</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{summarizePrescription(rx)}</p>
                            {rx.notes ? <p className="mt-2 text-sm leading-6">{rx.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Follow-up Chat
                  </CardTitle>
                  <CardDescription>
                    Ask targeted questions about contraindications, dose choices, workup, or how past history should change the plan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!suggestions || chatLoading}
                        className="max-w-full bg-transparent text-left whitespace-normal"
                        onClick={() => setChatInput(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border bg-muted/10 p-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("aiAssistPage.noMessagesYet")}</p>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                        >
                          {message.role === "assistant" ? <Bot className="mt-1 h-4 w-4 text-primary" /> : null}
                          <div
                            className={cn(
                              "max-w-[88%] rounded-2xl px-4 py-3 text-sm",
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <div className="prose max-w-none text-sm dark:prose-invert">
                                <Markdown remarkPlugins={[remarkGfm as any]}>{message.content}</Markdown>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            )}
                          </div>
                          {message.role === "user" ? <UserIcon className="mt-1 h-4 w-4 text-muted-foreground" /> : null}
                        </div>
                      ))
                    )}

                    {chatLoading ? (
                      <div className="flex gap-2">
                        <Bot className="mt-1 h-4 w-4 text-primary" />
                        <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Thinking through the follow-up question...
                        </div>
                      </div>
                    ) : null}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t("aiAssistPage.chatPlaceholder")}
                      disabled={!suggestions || chatLoading}
                    />
                    <Button type="submit" disabled={!chatInput.trim() || !suggestions || chatLoading} className="gap-2">
                      {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {t("aiAssistPage.send")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function SectionBlock({
  title,
  icon,
  items,
  empty,
  tone,
}: {
  title: string
  icon: ReactNode
  items: string[]
  empty: string
  tone: "warning" | "neutral"
}) {
  return (
    <div className={cn("rounded-2xl border p-4", tone === "warning" ? "border-amber-300/50 bg-amber-500/5" : "bg-muted/10")}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={`${item}-${index}`} variant={tone === "warning" ? "destructive" : "secondary"}>
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}
