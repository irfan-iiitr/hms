"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, Loader2, AlertTriangle, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n"
import type { MedicalImageAnalysis } from "@/lib/types"
import type { ReactNode } from "react"

export type ImageModality = "xray" | "ct" | "mri" | "ultrasound" | "other"

export interface MedicalImageAnalyzerProps {
  pageTitle: string
  pageSubtitle: string
  defaultImageType: ImageModality
  allowedImageTypes?: ImageModality[]
  /** Optional extra help (e.g. MRI upload format note) */
  formatNote?: ReactNode
  backHref: string
  patientId?: string
}

export function MedicalImageAnalyzer({
  pageTitle,
  pageSubtitle,
  defaultImageType,
  allowedImageTypes = ["xray", "ct", "mri", "ultrasound", "other"],
  formatNote,
  backHref,
  patientId,
}: MedicalImageAnalyzerProps) {
  const { toast } = useToast()
  const { t } = useI18n()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageType, setImageType] = useState<ImageModality>(defaultImageType)
  const [clinicalContext, setClinicalContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<MedicalImageAnalysis | null>(null)
  const imageTypeLabel: Record<ImageModality, string> = {
    xray: "X-Ray",
    ct: "CT Scan",
    mri: "MRI",
    ultrasound: "Ultrasound",
    other: "Other",
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const filename = file.name.toLowerCase()
      if (filename.endsWith(".dcm")) {
        toast({
          title: t("img.dicomTitle", "DICOM not supported here"),
          description: t("img.dicomDesc", "Raw .dcm files are not supported. Export a PNG/JPEG slice first."),
          variant: "destructive",
        })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("common.error", "Error"),
          description: t("img.errorNotImage", "Please select an image file"),
          variant: "destructive",
        })
        return
      }

      setImageFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!imageFile) {
        toast({
          title: t("common.error", "Error"),
          description: t("img.errorNoFile", "Please select an image"),
          variant: "destructive",
        })
      return
    }

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1]

        const response = await fetch("/api/clinical-tools/image-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            imageType,
            mimeType: imageFile.type || "image/jpeg",
            clinicalContext,
            patientId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          setAnalysis(data.data)
          toast({
            title: t("img.analysisDone", "Analysis Complete"),
            description: t("img.analysisDoneDesc", "Image has been analyzed"),
          })
        } else {
          throw new Error(data.message)
        }
        setLoading(false)
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : t("img.analysisFail", "Failed to analyze image"),
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white"
      case "significant":
        return "bg-orange-500 text-white"
      case "mild":
        return "bg-yellow-500 text-black"
      case "normal":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={backHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground mt-2">{pageSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t("img.uploadTitle", "Upload Image")}
              </CardTitle>
              <CardDescription>{t("img.uploadDesc", "Upload a medical image for AI-assisted review")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("img.typeLabel", "Image Type")}</label>
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value as ImageModality)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  {allowedImageTypes.map((type) => (
                    <option key={type} value={type}>
                      {imageTypeLabel[type]}
                    </option>
                  ))}
                </select>
              </div>

              {formatNote ? (
                <Alert>
                  <AlertDescription className="text-xs">{formatNote}</AlertDescription>
                </Alert>
              ) : null}

              <div>
                <label className="text-sm font-medium">{t("img.contextLabel", "Clinical Context (Optional)")}</label>
                <textarea
                  className="w-full min-h-20 px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  placeholder={t("img.contextPh", "Patient symptoms, clinical history, reason for imaging...")}
                  value={clinicalContext}
                  onChange={(e) => setClinicalContext(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("img.selectLabel", "Select Image")}</label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                  {t(
                    "img.selectHint",
                    "Accepted: PNG, JPEG, WebP, GIF. For MRI, use an exported 2D slice or screenshot—not raw DICOM in this version.",
                  )}
                </p>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="mt-1" />
              </div>

              {imagePreview && (
                <div className="border border-border rounded-lg p-4">
                  <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                </div>
              )}

              <Button onClick={handleAnalyze} disabled={loading || !imageFile} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("img.analyzing", "Analyzing Image...")}
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t("img.analyze", "Analyze Image")}
                  </>
                )}
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {t(
                    "img.disclaimer",
                    "This is an AI-assisted preliminary analysis. Always obtain professional radiological interpretation for diagnostic purposes.",
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("img.resultsTitle", "Analysis Results")}</CardTitle>
              <CardDescription>
                {analysis
                  ? t("img.resultsReady", "AI-generated findings and impressions")
                  : t("img.resultsEmpty", "Results will appear here")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">{t("img.findings", "Findings")}:</h3>
                    {analysis.findings.map((finding, i) => (
                      <Card
                        key={i}
                        className="border-l-4"
                        style={{ borderLeftColor: finding.severity === "Critical" ? "#ef4444" : "#3b82f6" }}
                      >
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-medium">{finding.finding}</p>
                            <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {t("img.location", "Location")}: {finding.location}
                            </span>
                            <Badge variant="outline" className={getConfidenceColor(finding.confidence)}>
                              {finding.confidence} {t("img.confidenceSuffix", "Confidence")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">{t("img.impression", "Impression")}:</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm">{analysis.impression}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">{t("img.recommendations", "Recommendations")}:</h3>
                      <Card>
                        <CardContent className="pt-4">
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <Alert variant="default">
                    <AlertDescription className="text-xs">{analysis.disclaimer}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("img.uploadPrompt", "Upload and analyze an image to see results")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
