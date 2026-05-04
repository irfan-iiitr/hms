# Recent changes — ICMR, Video Call, Medicine Web-Search (short)

Commits reviewed (last ~8):
- 39eaa37 — checkpoint i89
- 64fa0fe — checkpoint icmr
- 57293ab — checkpoint 5
- 884583f — vc cp 3
- f9759ce — vc cp 2
- e330e53 — vc cp 1
- dd90f34 — eliminate waste
- 7281c49 — fix: icon

Highlights
- ICMR guidelines: project updated to reflect ICMR guidance in appointment flows and clinical tools.
- Video calls: multiple incremental fixes and UX/server updates for video calls (Stream Video SDK integration, token/signaling improvements).
- Medicine web-search: server-side web search + AI extraction to surface likely dosages and purchase links (Serper search, Google Gemini via @google/generative-ai as fallback, plus a regex/text extractor).

Tech & external libs/APIs used
- Next.js 16, React 18, TypeScript
- UI: Tailwind CSS, Radix UI components
- Video/Chat: @stream-io/video-react-sdk, stream-chat
- AI/search: @google/generative-ai (Gemini), Serper web search (env: SERPER_API_KEY)
- DB/storage: MongoDB (`mongodb`), Cloudinary

Where to inspect code
- Dosage web-search & extractor: `lib/ai-clinical-tools.ts`
- AI helpers: `lib/ai-utils.ts`
- Video call UI: `components/video-call.tsx`
- Stream token API: `app/api/stream-token`

Notes
- The web-search dosage extractor marks results as "Not specified" when no concrete dosage is found; Serper/Gemini configuration requires API keys in env.
- If you want this file committed under git, expanded into a full CHANGELOG, or shortened further, tell me which option to do next.
