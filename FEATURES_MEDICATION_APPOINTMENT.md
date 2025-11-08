# Medication Interaction Check & Appointment Prep Pack

Two new AI-powered features for the patient dashboard, implemented with a modular architecture.

## 🏗️ Architecture

### 1. **Medication Interaction & Duplicate Therapy Check**

Analyzes patient prescriptions for potential drug-drug interactions and duplicate therapies.

**Components:**
- `lib/medication-utils.ts` - Core logic for interaction detection
- `app/api/medication-check/route.ts` - API endpoint
- `components/medication-interaction-card.tsx` - UI component
- Integration in `components/dashboards/patient-dashboard.tsx`

**Features:**
- Rule-based interaction database (expandable)
- Duplicate therapy detection by therapeutic class
- Severity classification (minor/moderate/major/critical)
- AI-enhanced analysis (optional, uses Gemini if API key configured)
- Contextual recommendations and "Contact Provider" CTA
- Collapsible details view

**Risk Levels:**
- **Critical**: Immediate action required (e.g., SSRI + MAOI)
- **High**: Contact provider before next dose
- **Moderate**: Discuss at next appointment
- **Low**: Mention to provider when convenient

### 2. **Appointment Preparation Pack**

Generates personalized checklist, questions, and prep guidance for upcoming appointments.

**Components:**
- `lib/appointment-prep-utils.ts` - Core prep generation logic
- `app/api/appointment-prep/route.ts` - API endpoint
- `components/appointment-prep-card.tsx` - UI component
- Integration in `components/dashboards/patient-dashboard.tsx`

**Features:**
- Context-aware checklist based on appointment reason
- Suggested questions tailored to condition and history
- Document requirements
- Important things to mention (recent diagnoses, medication changes)
- Progress tracking with checkboxes
- AI-enhanced generation (optional, uses Gemini if API key configured)
- Category badges (documents, symptoms, questions, medications, lifestyle)

**Checklist Categories:**
- 📄 **Documents**: Insurance cards, referrals, test results
- ⚠️ **Symptoms**: Tracking and documentation
- 💬 **Questions**: Prepared questions for the doctor
- 💊 **Medications**: Current med list, changes, interactions
- 🏃 **Lifestyle**: Fasting, hydration, transportation

---

## 🚀 Usage

### Patient Dashboard Flow

1. **Patient logs in** → Dashboard loads prescriptions and appointments
2. **Medication Check**:
   - If prescriptions exist, "Check My Medications" button appears in sidebar
   - Click → Analyzes all active prescriptions
   - Shows interaction card with severity, descriptions, and recommendations
   - Optional AI analysis provides enhanced context
3. **Appointment Prep**:
   - If scheduled appointment exists, "Prepare for Appointment" button appears
   - Click → Generates personalized prep pack
   - Shows checklist, questions, documents needed, and things to mention
   - Patient can check off items as they complete them

### API Endpoints

#### `POST /api/medication-check`
```json
{
  "medications": [
    { "name": "Lisinopril", "dosage": "10mg", "frequency": "once daily" },
    { "name": "Spironolactone", "dosage": "25mg", "frequency": "once daily" }
  ],
  "patientAllergies": ["penicillin"],
  "useAI": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interactions": [...],
    "duplicates": [...],
    "overallRisk": "moderate",
    "contactProvider": true,
    "summary": "Found 1 potential interaction."
  },
  "aiAnalysis": "Enhanced AI-generated analysis..."
}
```

#### `POST /api/appointment-prep`
```json
{
  "appointmentId": "6734a1b2c3d4e5f6a7b8c9d0",
  "patientId": "6734a1b2c3d4e5f6a7b8c9d1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "...",
    "appointmentReason": "Follow-up for hypertension",
    "appointmentDate": "2025-11-15T10:00:00.000Z",
    "checklist": [
      {
        "id": "universal-123-0",
        "text": "Bring your insurance card and photo ID",
        "completed": false,
        "category": "documents"
      }
    ],
    "questionsToAsk": [
      "What are the next steps in my care plan?",
      "How is my condition progressing?"
    ],
    "thingsToMention": [
      "Recent diagnosis: Hypertension (11/1/2025)"
    ],
    "documentsNeeded": ["Insurance card", "Photo ID"],
    "summary": "Prepare for your Follow-up for hypertension appointment..."
  }
}
```

---

## 🧠 AI Enhancement

Both features support optional AI enhancement via Google Gemini:

**Environment Variables:**
```bash
# Set one of these (in order of preference):
GEMINI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
GENERATIVE_API_KEY=your_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here  # client-side fallback

# Optional: specify model (default: gemini-2.5-flash-preview-09-2025)
GEMINI_MODEL_NAME=gemini-2.5-flash-preview-09-2025
```

**Without API Key:**
- Both features fall back to rule-based logic
- Medication check uses hardcoded interaction database
- Appointment prep uses reason-based template generation
- Still fully functional, just less personalized

**With API Key:**
- Medication check gets enhanced context-aware analysis
- Appointment prep gets fully personalized checklists and questions
- Better consideration of patient history and nuances

---

## 📋 Type Definitions

All new types are in `lib/types.ts`:

```typescript
interface MedicationInteraction {
  id: string
  medication1: string
  medication2: string
  severity: "minor" | "moderate" | "major" | "critical"
  description: string
  recommendation: string
}

interface DuplicateTherapy {
  id: string
  medications: string[]
  therapeuticClass: string
  description: string
  recommendation: string
}

interface MedicationCheckResult {
  interactions: MedicationInteraction[]
  duplicates: DuplicateTherapy[]
  overallRisk: "low" | "moderate" | "high" | "critical"
  contactProvider: boolean
  summary: string
}

interface PrepChecklistItem {
  id: string
  text: string
  completed: boolean
  category: "documents" | "symptoms" | "questions" | "lifestyle" | "medications"
}

interface AppointmentPrepPack {
  appointmentId: string
  appointmentReason: string
  appointmentDate: Date
  checklist: PrepChecklistItem[]
  questionsToAsk: string[]
  thingsToMention: string[]
  documentsNeeded: string[]
  summary: string
}
```

---

## 🎨 UI Components

### `MedicationInteractionCard`

**Props:**
- `result: MedicationCheckResult` - Analysis results
- `aiAnalysis?: string` - Optional AI-enhanced analysis
- `onContactProvider?: () => void` - Callback for contact CTA

**Features:**
- Risk badge (color-coded by severity)
- Collapsible details sections
- Separate toggles for interactions, duplicates, and AI analysis
- Contact provider CTA when needed
- Disclaimers and safety notes

### `AppointmentPrepCard`

**Props:**
- `prepPack: AppointmentPrepPack` - Preparation data
- `onChecklistChange?: (itemId: string, completed: boolean) => void` - Callback for checklist updates

**Features:**
- Progress bar tracking checklist completion
- Interactive checkboxes with category badges
- Collapsible sections for questions, things to mention, documents
- Visual appointment date display
- Tip callouts for best practices

---

## 🔒 Safety & Disclaimers

Both features include strong disclaimers:

**Medication Check:**
- "This check uses a basic interaction database and may not catch all interactions."
- Encourages consulting pharmacist/provider
- Flags when urgent action is needed

**Appointment Prep:**
- "This preparation pack is a guide based on your appointment details..."
- Recommends confirming requirements with provider's office
- AI-generated content marked as non-medical advice

---

## 🧪 Testing

**Manual Test Flow:**

1. **Setup test data:**
   - Create a patient with multiple prescriptions
   - Include medications known to interact (e.g., Lisinopril + Spironolactone)
   - Create a scheduled appointment

2. **Test Medication Check:**
   - Navigate to patient dashboard
   - Click "Check My Medications"
   - Verify interaction card appears
   - Check risk level and recommendations
   - Toggle details sections

3. **Test Appointment Prep:**
   - Click "Prepare for Appointment"
   - Verify prep pack generates
   - Check off checklist items
   - Verify progress updates
   - Expand question/document sections

---

## 🚧 Future Enhancements

**Medication Check:**
- [ ] Integrate with comprehensive drug database (First Databank, Micromedex)
- [ ] Add allergy-medication cross-checking
- [ ] Support for over-the-counter and supplement interactions
- [ ] Dosage-specific warnings
- [ ] Age/weight-based contraindications
- [ ] Export report for provider

**Appointment Prep:**
- [ ] Calendar integration (Google/Apple/Outlook)
- [ ] Email/SMS reminders with checklist
- [ ] Voice memo feature for symptoms
- [ ] Share prep pack with family member
- [ ] Post-appointment follow-up checklist
- [ ] Multi-language support

---

## 📁 File Structure

```
lib/
  ├── types.ts                        # Extended types
  ├── medication-utils.ts             # Medication analysis logic
  └── appointment-prep-utils.ts       # Prep pack generation logic

app/api/
  ├── medication-check/
  │   └── route.ts                    # Medication check endpoint
  └── appointment-prep/
      └── route.ts                    # Appointment prep endpoint

components/
  ├── medication-interaction-card.tsx  # Interaction UI
  ├── appointment-prep-card.tsx        # Prep pack UI
  └── dashboards/
      └── patient-dashboard.tsx        # Integration layer
```

---

## 🎯 Design Principles

1. **Modular**: Each feature is self-contained with clear interfaces
2. **Graceful Degradation**: Works without AI; AI enhances but isn't required
3. **Safety-First**: Clear disclaimers, severity indicators, and CTAs
4. **User-Centric**: Simple language, actionable guidance, visual progress
5. **Extensible**: Easy to add new interaction rules or prep templates
6. **Type-Safe**: Full TypeScript coverage with strict types

---

## 📞 Support

For issues or questions:
- Check medication database in `lib/medication-utils.ts` for coverage
- Verify API key configuration for AI features
- Review console logs for API errors
- Ensure patient has prescriptions/appointments for features to activate
