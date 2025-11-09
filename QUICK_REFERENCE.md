# Quick Reference: AI Clinical Tools & Analytics

## 🚀 Quick Start

### Environment Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/hms" > .env
echo "GEMINI_API_KEY=your_key_here" >> .env

# 3. Start dev server
pnpm dev
```

### Get Gemini API Key
https://makersuite.google.com/app/apikey

---

## 📊 Analytics Dashboard

### Access
**URL:** `/dashboard/doctor/analytics`  
**Button:** Doctor Dashboard → Analytics (top right)

### Quick Test
```bash
curl http://localhost:3000/api/analytics/doctor
```

### Features
- 📈 Patient stats, demographics, age distribution
- 📅 Appointment patterns (hourly, daily, seasonal)
- 💊 Top diagnoses and medications
- ⏱️ Performance metrics (wait time, satisfaction)
- 💾 Export to JSON

---

## 🧠 AI Clinical Tools

### 1. Differential Diagnosis

**Access:** Clinical Tools Panel → Diagnosis Tab

**API Test:**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/differential-diagnosis \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"fever, cough, chest pain","patientAge":45}'
```

**Response:**
```json
{
  "diagnoses": [
    {
      "condition": "Pneumonia",
      "probability": "high",
      "severity": "moderate",
      "reasoning": "...",
      "recommendedTests": ["Chest X-ray", "CBC"]
    }
  ]
}
```

---

### 2. Drug Interactions

**Access:** 
- Clinical Tools Panel → Interactions Tab
- Patient Detail → Create Prescription (automatic)

**API Test:**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/drug-interactions \
  -H "Content-Type: application/json" \
  -d '{"medications":["Warfarin","Aspirin"]}'
```

**Response:**
```json
{
  "hasInteractions": true,
  "interactions": [
    {
      "drugs": ["Warfarin", "Aspirin"],
      "severity": "severe",
      "description": "Increased bleeding risk",
      "recommendation": "Monitor INR closely"
    }
  ]
}
```

---

### 3. Literature Search

**Access:** Clinical Tools Panel → Literature Tab

**API Test:**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/literature-search \
  -H "Content-Type: application/json" \
  -d '{"query":"diabetes management guidelines","filters":{"type":"guideline"}}'
```

---

### 4. Image Analysis

**Access:** 
- Doctor Dashboard → Image Analysis button
- `/dashboard/doctor/image-analysis`

**API Test (Upload):**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/image-analysis \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,...","imageType":"x-ray","patientId":"123"}'
```

**API Test (Retrieve):**
```bash
curl "http://localhost:3000/api/clinical-tools/image-analysis?patientId=123"
```

---

### 5. Voice Clinical Notes

**Access:** Patient Detail → Add Record → Voice Notes button

**Features:**
- 🎤 Browser microphone recording
- 📝 Auto-transcription (mock - integrate Whisper API)
- 🧠 AI entity extraction (diagnosis, symptoms)
- ✏️ Auto-populate form fields

**API Test:**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/process-notes \
  -H "Content-Type: application/json" \
  -d '{"transcription":"Patient diagnosed with diabetes, symptoms include increased thirst"}'
```

---

### 6. Dosage Calculator

**Access:** Clinical Tools Panel → Dosage Tab

**API Test:**
```bash
curl -X POST http://localhost:3000/api/clinical-tools/calculate-dosage \
  -H "Content-Type: application/json" \
  -d '{"medication":"Metformin","patientWeight":85,"patientAge":55,"renalFunction":"mild"}'
```

---

## 🔧 Development

### File Locations

**Analytics:**
- Utils: `lib/analytics-utils.ts`
- API: `app/api/analytics/doctor/route.ts`
- Component: `components/dashboards/doctor-analytics.tsx`
- Page: `app/dashboard/doctor/analytics/page.tsx`

**AI Tools:**
- Utils: `lib/ai-clinical-tools.ts`
- APIs: `app/api/clinical-tools/*/route.ts`
- Components: 
  - `components/clinical-tools-panel.tsx`
  - `components/voice-recorder.tsx`
- Pages:
  - `app/dashboard/doctor/clinical-tools/page.tsx`
  - `app/dashboard/doctor/image-analysis/page.tsx`

**Types:**
- All interfaces: `lib/types.ts`

---

### Adding New AI Tool

1. **Add utility function** in `lib/ai-clinical-tools.ts`:
```typescript
export async function myNewTool(input: string): Promise<Result> {
  const prompt = `Your medical prompt here: ${input}`
  const result = await model.generateContent(prompt)
  return parseResult(result)
}
```

2. **Create API route** in `app/api/clinical-tools/my-tool/route.ts`:
```typescript
import { myNewTool } from "@/lib/ai-clinical-tools"

export async function POST(req: Request) {
  const { input } = await req.json()
  const result = await myNewTool(input)
  return NextResponse.json(result)
}
```

3. **Add UI tab** in `components/clinical-tools-panel.tsx`:
```tsx
<TabsContent value="my-tool">
  <form onSubmit={handleMyTool}>
    {/* Form inputs */}
  </form>
  {/* Display results */}
</TabsContent>
```

4. **Add types** in `lib/types.ts`:
```typescript
export interface MyToolResult {
  // Your interface
}
```

---

## 🗄️ MongoDB

### Collections
```
users              - Patients & doctors
appointments       - Appointments
medical_records    - Medical records
prescriptions      - Prescriptions
sessions           - User sessions
image_analyses     - AI-analyzed images (NEW)
```

### Query Image Analyses
```javascript
db.image_analyses.find({ patientId: "123" }).sort({ analyzedAt: -1 })
```

---

## 🐛 Debugging

### Check Gemini API
```bash
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

### Check MongoDB
```bash
mongo
> use hms
> db.image_analyses.countDocuments()
```

### Enable Debug Logging
```typescript
// In lib/logger.ts
logger.level = "debug"
```

---

## 📚 Documentation

- **[Analytics Guide](./ANALYTICS_DASHBOARD_IMPLEMENTATION.md)** - Complete analytics documentation
- **[AI Tools Guide](./AI_CLINICAL_TOOLS_IMPLEMENTATION.md)** - Complete AI tools documentation
- **[Summary](./FEATURE_IMPLEMENTATION_SUMMARY.md)** - Feature summary

---

## ⚡ Common Commands

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build production
pnpm build

# Start production
pnpm start

# Lint code
pnpm lint

# Type check
pnpm tsc --noEmit
```

---

## 🎯 Testing Checklist

### Analytics
- [ ] Dashboard loads without errors
- [ ] All charts render correctly
- [ ] Stats update on refresh
- [ ] Export to JSON works

### AI Tools
- [ ] Differential diagnosis generates results
- [ ] Drug interaction checker finds interactions
- [ ] Literature search returns articles
- [ ] Image analysis processes images
- [ ] Voice recorder records and transcribes
- [ ] Dosage calculator provides recommendations

### Integration
- [ ] Voice recorder in medical record form
- [ ] Drug checker in prescription form
- [ ] Quick access cards in patient detail
- [ ] Navigation buttons work

---

## 🔐 Security Checklist

- [x] GEMINI_API_KEY not exposed to client
- [x] All AI calls in API routes (server-side)
- [x] Input validation on all endpoints
- [x] Type safety with TypeScript
- [x] Error handling with try-catch
- [x] Session-based authentication
- [x] Role-based access control

---

## 🚨 Troubleshooting

**Problem:** "GEMINI_API_KEY not found"  
**Solution:** Add to `.env`, restart server

**Problem:** MongoDB connection error  
**Solution:** Start MongoDB or use cloud URI

**Problem:** Charts not rendering  
**Solution:** `pnpm install recharts`

**Problem:** Voice recording fails  
**Solution:** Use Chrome/Firefox, allow mic permissions

**Problem:** Image upload too large  
**Solution:** Resize to < 1MB, use JPEG

---

## 📞 Support

- GitHub Issues: [Repository Issues](https://github.com/yourusername/hms/issues)
- Documentation: See files in project root
- Gemini API Docs: https://ai.google.dev/docs

---

**Last Updated:** January 2025  
**Version:** 1.0.0
