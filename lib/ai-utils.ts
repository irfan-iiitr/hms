
// Send a medical file to Gemini (or a configured AI endpoint) and extract information.
// IMPORTANT: Do NOT hardcode API keys in source. Set the following environment variables in your
// server environment (e.g. in .env.local) and restart the Next.js server:
//
// GEMINI_API_URL=https://your-generative-api.example.com/v1/extract
// GEMINI_API_KEY=ya29.... (keep secret, do NOT commit)
//
// When both variables are present the function will attempt to POST the file to GEMINI_API_URL
// with an Authorization: Bearer header. If they are not present, a mocked response is returned
// (useful for local dev without credentials).
export async function sendToGeminiMedicalFile(file: File): Promise<{ summary: string; details: any }> {
  // Prefer GEMINI_API_KEY (server secret) but accept GOOGLE_API_KEY or GENERATIVE_API_KEY too.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  // API URL may be explicitly provided, otherwise we'll use the Google Generative Language endpoint for Gemini Vision.
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  // If user mistakenly set the API key into GEMINI_API_URL (common), detect and clear it.
  if (apiUrl && apiUrl.startsWith("AIza")) {
    console.warn("It looks like GEMINI_API_URL contains an API key. Please set GEMINI_API_URL to the full endpoint URL or leave it empty to use the default model endpoint.")
    apiUrl = ""
  }

  if (!apiKey) {
    console.warn("GEMINI API key not configured; returning mocked extraction result")
    await new Promise((resolve) => setTimeout(resolve, 400))
    const mockResult = {
      summary: "Extracted summary from uploaded file (mocked)",
      details: { type: (file as any)?.type, name: (file as any)?.name, size: (file as any)?.size },
    }
    console.log("[ai-utils] Returning mock result:", mockResult)
    return mockResult
  }

  // Use the official generateContent model endpoint if apiUrl not provided
  if (!apiUrl) {
    // NOTE: update model name as needed for your account/preview access
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${encodeURIComponent(apiKey)}`
  } else if (!apiUrl.includes("key=")) {
    // If apiUrl provided but no key param, append apiKey as query param (API key auth)
    const sep = apiUrl.includes("?") ? "&" : "?"
    apiUrl = `${apiUrl}${sep}key=${encodeURIComponent(apiKey)}`
  }

  // Build prompt
  const prompt = `You are an assistant that extracts important structured information from an uploaded medical test image or PDF (lab report, scan, test results, prescription).\n\n` +
    `Return a single JSON object with  fields that seem important for medical purposes \n` +
    `Return ONLY valid JSON and nothing else. If you cannot extract values, keep fields null and include a \"raw_text\" field with key findings.`

  // Convert file to base64 (Node-compatible)
  let base64 = ""
  try {
    const buffer = Buffer.from(await (file as any).arrayBuffer())
    base64 = buffer.toString("base64")
  } catch (e) {
    console.error("failed to read file for Gemini Vision:", e)
    return { summary: "(error) could not read file", details: { error: String(e) } }
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: (file as any)?.type || "application/octet-stream", data: base64 } },
        ],
      },
    ],
  }

  // Backoff helper
  async function fetchWithBackoff(url: string, options: any, retries = 4, delay = 800): Promise<Response> {
    try {
      const res = await fetch(url, options)
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        const err = new Error(`HTTP ${res.status} ${res.statusText} - ${body}`)
        ;(err as any).status = res.status
        throw err
      }
      return res
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delay))
        return fetchWithBackoff(url, options, retries - 1, delay * 2)
      }
      throw err
    }
  }

  try {
    const res = await fetchWithBackoff(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    console.log("[ai-utils] Gemini API raw response:", JSON.stringify(json).substring(0, 500))

    // Example response structure: { candidates: [ { content: { parts: [ { text: '...' } ] } } ] }
    const candidate = json?.candidates?.[0]
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.find((p: any) => p.text)?.text || JSON.stringify(json)
    console.log("[ai-utils] Extracted text from response:", text.substring(0, 300))

    // Try to parse JSON from the returned text
    let parsed: any = null
    try {
      parsed = JSON.parse(text)
      console.log("[ai-utils] Successfully parsed JSON:", Object.keys(parsed))
    } catch (err) {
      console.log("[ai-utils] Text is not valid JSON, trying to extract JSON substring")
      const first = text.indexOf("{")
      const last = text.lastIndexOf("}")
      if (first !== -1 && last !== -1 && last > first) {
        try {
          parsed = JSON.parse(text.slice(first, last + 1))
          console.log("[ai-utils] Extracted and parsed JSON:", Object.keys(parsed))
        } catch (e) {
          console.log("[ai-utils] Failed to extract JSON from text")
          parsed = null
        }
      }
    }

    if (parsed) {
      const result = { summary: parsed.test_name ? `Extracted ${parsed.test_name}` : "Extracted data", details: parsed }
      console.log("[ai-utils] Returning parsed result:", result.summary)
      return result
    }

    // If not JSON, return the raw candidate text
    const result = { summary: "Extraction result (text)", details: { text } }
    console.log("[ai-utils] Returning text result")
    return result
  } catch (err) {
    console.error("callGeminiVisionAPI error:", err)
    return { summary: "(error) could not extract — see server logs", details: { error: String(err) } }
  }
}
// AI utility functions - simulating Gemini API responses
// In production, this would call the actual Gemini API via Vercel AI Gateway

export async function generateAIPrescriptionSuggestions(diagnosis: string, symptoms: string[]): Promise<string> {
  // Simulate API call with realistic prescription suggestions
  const prescriptionDatabase: { [key: string]: string } = {
    hypertension:
      "Based on the diagnosis of hypertension with symptoms of high blood pressure and headaches:\n\n1. **Primary Medication**: Lisinopril 10mg once daily\n   - An ACE inhibitor that helps lower blood pressure\n   - Take consistently at the same time each day\n\n2. **Complementary**: Amlodipine 5mg once daily\n   - A calcium channel blocker for additional blood pressure control\n\n3. **Lifestyle**: Reduce sodium intake, exercise 30 mins daily, stress management\n\n4. **Follow-up**: Monitor blood pressure weekly, recheck in 4 weeks",

    diabetes:
      "Based on the diagnosis of Type 2 Diabetes with symptoms of increased thirst and fatigue:\n\n1. **Primary Medication**: Metformin 500mg twice daily\n   - First-line treatment for Type 2 Diabetes\n   - Take with meals to reduce side effects\n\n2. **Supplementary**: Gliclazide 80mg once daily\n   - Helps stimulate insulin production\n\n3. **Monitoring**: Check blood glucose levels before meals and at bedtime\n\n4. **Lifestyle**: Regular exercise, balanced diet low in refined sugars\n\n5. **Follow-up**: HbA1c test in 3 months",

    "allergic rhinitis":
      "Based on the diagnosis of Allergic Rhinitis with symptoms of nasal congestion and sneezing:\n\n1. **Antihistamine**: Cetirizine 10mg once daily\n   - Non-drowsy formulation\n   - Best taken in the evening\n\n2. **Nasal Spray**: Fluticasone 2 sprays in each nostril daily\n   - Reduces inflammation and congestion\n\n3. **PRN Relief**: Phenylephrine nasal spray as needed\n   - For acute congestion relief\n\n4. **Preventive**: Avoid allergen triggers, use air filters\n\n5. **Follow-up**: Reassess symptoms in 2 weeks",

    general:
      "Based on the provided symptoms, here are general recommendations:\n\n1. **Primary Assessment**: Further clinical evaluation may be needed\n\n2. **Symptomatic Relief**: Consider over-the-counter options based on specific symptoms\n\n3. **Monitoring**: Track symptom progression over 1-2 weeks\n\n4. **Follow-up**: Recommend follow-up appointment if symptoms persist\n\n5. **Lifestyle**: Adequate rest, hydration, and nutrition are important",
  }

  // Find matching prescription or use general
  const key = diagnosis.toLowerCase()
  let suggestion = prescriptionDatabase["general"]

  for (const [dbKey, dbValue] of Object.entries(prescriptionDatabase)) {
    if (key.includes(dbKey)) {
      suggestion = dbValue
      break
    }
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return suggestion
}

export async function generateMedicalAnalysis(diagnosis: string, symptoms: string[], notes: string): Promise<string> {
  // Simulate AI analysis of medical records
  const analysis = `
Medical Record Analysis:

**Diagnosis**: ${diagnosis}
**Symptoms**: ${symptoms.join(", ")}
**Clinical Notes**: ${notes}

**Analysis Summary**:
- Primary condition requires careful monitoring
- Current symptom profile aligns with diagnosis
- Recommended medication adjustments based on latest guidelines
- Patient education on condition management is essential

**Recommendations**:
1. Continue current treatment plan with close follow-up
2. Consider lifestyle modifications to support recovery
3. Monitor vital signs regularly
4. Schedule follow-up appointment in 4 weeks
5. Patient should maintain medication compliance

**Risk Assessment**: Low to Moderate
- Condition is manageable with proper treatment
- Patient education and compliance are key factors
  `

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return analysis
}

// Generate a plain-language summary for patients with strong guardrails.
// In production, replace this mock with an LLM call and keep the structure and disclaimers.
export async function generatePlainLanguageSummary(
  diagnosis: string,
  symptoms: string[] = [],
  notes: string = ""
): Promise<{ title: string; summary: string; disclaimer: string }> {
  // Prefer server-side secret keys
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENERATIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-09-2025"
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  // Local safe fallback if no key configured
  const localFallback = async () => {
    const safeDiagnosis = diagnosis?.trim() || "your recent visit"
    const cleanSymptoms = (symptoms || []).filter(Boolean)

    const points: string[] = []
    if (safeDiagnosis) points.push(`Main topic: ${safeDiagnosis}.`)
    if (cleanSymptoms.length) points.push(`What you reported: ${cleanSymptoms.join(", ")}.`)
    if (notes) points.push(`Doctor's notes (key points): ${notes.slice(0, 280)}${notes.length > 280 ? "…" : ""}`)

    const summary = [
      `Here’s a simple explanation of ${safeDiagnosis}:`,
      "",
      "What it means:",
      "- This is a general description based on your record.",
      "- It helps you understand the big picture, not every medical detail.",
      "",
      ...(points.length ? ["From your record:", ...points.map((p) => `- ${p}`), ""] : []),
      "What you can do:",
      "- Follow the plan your clinician provided (medicines, tests, follow-up).",
      "- Note any new or worsening symptoms.",
      "- Prepare questions for your next visit.",
    ].join("\n")

    const disclaimer =
      "This summary may be incomplete or inaccurate. It is not medical advice and does not replace guidance from your clinician. If you feel worse, have severe pain, trouble breathing, chest pain, or any emergency signs, seek urgent medical care."

    await new Promise((r) => setTimeout(r, 200))
    return { title: `In simple terms: ${safeDiagnosis}`, summary, disclaimer }
  }

  if (!apiKey) {
    console.warn("[ai-utils] GEMINI_API_KEY not configured; using local fallback for generatePlainLanguageSummary.")
    return localFallback()
  }

  // Build a guarded prompt that instructs STRICT JSON output
  const redactedNotes = (notes || "").toString().slice(0, 1200)
  const content = {
    diagnosis: diagnosis || "",
    symptoms: (symptoms || []).filter(Boolean).slice(0, 20),
    notes: redactedNotes,
  }

  const system =
    "You are a patient education assistant. Explain medical records in clear, simple language (around a few short paragraphs)." +
    " Be cautious, avoid definitive claims, and include safety notes. Return STRICT JSON with keys: title, summary, disclaimer."

  const userInstruction = `
Generate a plain-language summary for a patient based on this record content.
Write at a 6th–8th grade reading level, use short sentences, and include a brief action-oriented checklist.
Do NOT give medical advice. Include a strong safety disclaimer.

Return ONLY a JSON object with keys: "title", "summary", "disclaimer".
`.
    trim()

  const payload = {
    contents: [
      {
        parts: [
          { text: system },
          { text: userInstruction },
          { text: "Record content (JSON):" },
          { text: JSON.stringify(content) },
        ],
      },
    ],
  }

  // Simple exponential backoff
  async function fetchWithBackoff(url: string, options: any, retries = 3, delay = 600): Promise<Response> {
    try {
      const u = url.includes("?") ? `${url}&key=${encodeURIComponent(apiKey!)}` : `${url}?key=${encodeURIComponent(apiKey!)}`
      const res = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options?.body ?? payload),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        const err: any = new Error(`HTTP ${res.status} ${res.statusText} - ${t}`)
        err.status = res.status
        throw err
      }
      return res
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delay))
        return fetchWithBackoff(url, options, retries - 1, delay * 2)
      }
      throw e
    }
  }

  try {
    const res = await fetchWithBackoff(apiUrl, { body: payload })
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text || ""

    let parsed: any = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const first = text.indexOf("{")
      const last = text.lastIndexOf("}")
      if (first !== -1 && last !== -1 && last > first) {
        try { parsed = JSON.parse(text.slice(first, last + 1)) } catch {}
      }
    }

    const fallbackDisclaimer =
      "This summary may be incomplete or inaccurate. It is not medical advice and does not replace guidance from your clinician. If you feel worse, have severe pain, trouble breathing, chest pain, or any emergency signs, seek urgent medical care."

    if (parsed && typeof parsed === "object") {
      const title = String(parsed.title || `In simple terms: ${diagnosis || "your recent visit"}`)
      const summary = String(parsed.summary || "This is a general explanation based on your record.")
      const disclaimer = String(parsed.disclaimer || fallbackDisclaimer)
      return { title, summary, disclaimer }
    }

    // If parsing failed, degrade gracefully
    console.warn("[ai-utils] Gemini returned non-JSON content; using local fallback.")
    return localFallback()
  } catch (err) {
    console.error("[ai-utils] generatePlainLanguageSummary error:", err)
    return localFallback()
  }
}
