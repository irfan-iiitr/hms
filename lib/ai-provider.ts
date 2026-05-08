type ProviderName = "groq" | "gemini"

function getEnv(name: string) {
  const value = process.env[name]
  return typeof value === "string" ? value.trim() : ""
}

export function getConfiguredAIProvider(): ProviderName {
  const explicit = getEnv("AI_PROVIDER").toLowerCase()
  if (explicit === "groq") return "groq"
  if (explicit === "gemini") return "gemini"

  if (getEnv("GROQ_API_KEY")) return "groq"
  return "gemini"
}

export function getAIConfig() {
  const provider = getConfiguredAIProvider()

  if (provider === "groq") {
    return {
      provider,
      apiKey: getEnv("GROQ_API_KEY"),
      model: getEnv("GROQ_MODEL_NAME") || "llama-3.3-70b-versatile",
    }
  }

  return {
    provider,
    apiKey:
      getEnv("GEMINI_API_KEY") ||
      getEnv("GOOGLE_API_KEY") ||
      getEnv("GENERATIVE_API_KEY") ||
      getEnv("NEXT_PUBLIC_GEMINI_API_KEY"),
    model: getEnv("GEMINI_MODEL_NAME") || "gemini-2.5-flash-preview-09-2025",
  }
}

export async function generateTextWithConfiguredProvider(prompt: string, options?: { maxOutputTokens?: number; temperature?: number }) {
  const config = getAIConfig()
  if (!config.apiKey) return null

  if (config.provider === "groq") {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.35,
        max_tokens: options?.maxOutputTokens ?? 1800,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Groq API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data?.choices?.[0]?.message?.content?.trim() || ""
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.35,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: options?.maxOutputTokens ?? 1800,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Gemini API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.find((part: any) => part?.text)?.text?.trim() || ""
}

export async function generateChatWithConfiguredProvider(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userQuestion: string,
  options?: { maxOutputTokens?: number; temperature?: number }
) {
  const config = getAIConfig()
  if (!config.apiKey) return null

  if (config.provider === "groq") {
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
        .filter((message) => message.role === "user" || message.role === "assistant")
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content })),
      { role: "user", content: userQuestion },
    ]

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxOutputTokens ?? 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Groq API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data?.choices?.[0]?.message?.content?.trim() || ""
  }

  const contents: any[] = [{ parts: [{ text: systemPrompt }] }]

  conversationHistory
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-10)
    .forEach((message) => {
      contents.push({ parts: [{ text: message.content }] })
    })

  contents.push({ parts: [{ text: userQuestion }] })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: options?.maxOutputTokens ?? 1024,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Gemini API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.find((part: any) => part?.text)?.text?.trim() || ""
}
