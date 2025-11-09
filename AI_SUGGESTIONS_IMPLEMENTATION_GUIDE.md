# AI Suggestions Page - Quick Implementation Guide

## ✅ Status: Ready to Implement

All necessary API endpoints already exist! You can now implement the improved UI.

## Prerequisites Checklist

### API Endpoints (All Exist ✅)
- ✅ `/api/ai-suggestions` - Generate suggestions & chat
- ✅ `/api/ai-chats` - Persist/load chat history
- ✅ `/api/clinical-tools/differential-diagnosis` - Differential diagnosis
- ✅ `/api/clinical-tools/drug-interactions` - Check medication interactions
- ✅ `/api/clinical-tools/dosage-calculator` - Calculate dosages
- ✅ `/api/clinical-tools/literature-search` - Search medical literature
- ✅ `/api/medical-records` - Save to patient record
- ✅ `/api/users/[id]` - Get patient context

### UI Components Needed
- ✅ `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` from shadcn/ui
- ✅ `Badge` from shadcn/ui
- ✅ `Separator` from shadcn/ui
- ✅ `useToast` hook
- ✅ All icons from lucide-react

## Step-by-Step Implementation

### Step 1: Backup Current File
```bash
cp app/dashboard/doctor/patient/[id]/ai-suggestions/page.tsx app/dashboard/doctor/patient/[id]/ai-suggestions/page.backup.tsx
```

### Step 2: Key Changes to Make

#### A. Update Imports
Add these imports to the existing file:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  // ... existing icons
  RefreshCw  // Add this one
} from "lucide-react"
```

#### B. Add New State
After the existing state declarations, add:
```typescript
// Clinical tools state
const [activeTab, setActiveTab] = useState<string>("suggestions")
const [clinicalToolsData, setClinicalToolsData] = useState<Record<ClinicalTool, any>>({
  diagnosis: null,
  interactions: null,
  dosage: null,
  literature: null
})
const [toolLoading, setToolLoading] = useState<ClinicalTool | null>(null)
const [patientContext, setPatientContext] = useState<any>(null)
```

#### C. Add Patient Context Loading
Add this useEffect:
```typescript
// Load patient context on mount
useEffect(() => {
  let ignore = false
  const loadPatientContext = async () => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(patientId)}`)
      const data = await res.json()
      if (!ignore && data?.success && data?.user) {
        setPatientContext(data.user)
      }
    } catch (e) {
      console.warn("Failed to load patient context", e)
    }
  }
  loadPatientContext()
  return () => { ignore = true }
}, [patientId])
```

#### D. Add Clinical Tools Handler
```typescript
async function handleClinicalTool(tool: ClinicalTool) {
  setToolLoading(tool)
  setError("")
  
  try {
    let endpoint = ""
    let body: any = {}
    
    switch (tool) {
      case "diagnosis":
        endpoint = "/api/clinical-tools/differential-diagnosis"
        body = {
          symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
          patientContext: {
            age: patientContext?.dateOfBirth 
              ? Math.floor((Date.now() - new Date(patientContext.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : undefined,
            gender: patientContext?.gender,
            medicalHistory: patientContext?.medicalHistory,
            allergies: patientContext?.allergies,
          }
        }
        break
        
      case "interactions":
        endpoint = "/api/clinical-tools/drug-interactions"
        const rxRes = await fetch(`/api/prescriptions?patientId=${encodeURIComponent(patientId)}`)
        const rxData = await rxRes.json()
        const medications = rxData?.prescriptions?.[0]?.medications || []
        
        body = {
          medications: medications.map((m: any) => ({ name: m.name, dosage: m.dosage })),
          patientContext: {
            age: patientContext?.dateOfBirth 
              ? Math.floor((Date.now() - new Date(patientContext.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : undefined,
            allergies: patientContext?.allergies,
          }
        }
        break
        
      case "dosage":
        endpoint = "/api/clinical-tools/dosage-calculator"
        body = {
          medication: diagnosis || "General medication",
          patientFactors: {
            age: patientContext?.dateOfBirth 
              ? Math.floor((Date.now() - new Date(patientContext.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : 40,
            weight: 70, // Default
            indication: diagnosis || condition || "Treatment",
          }
        }
        break
        
      case "literature":
        endpoint = "/api/clinical-tools/literature-search"
        body = {
          query: diagnosis || condition || symptoms.split(",")[0]?.trim() || "general medicine",
          type: "guidelines"
        }
        break
    }
    
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    
    const data = await res.json()
    
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Failed to run ${tool} tool`)
    }
    
    setClinicalToolsData(prev => ({ ...prev, [tool]: data.data }))
    setActiveTab(tool)
    
    toast({
      title: "Clinical Tool Executed",
      description: `${tool.charAt(0).toUpperCase() + tool.slice(1)} analysis completed`,
    })
  } catch (err: any) {
    console.error(`Clinical tool ${tool} error`, err)
    toast({
      title: "Error",
      description: err?.message || `Failed to run ${tool} tool`,
      variant: "destructive",
    })
  } finally {
    setToolLoading(null)
  }
}
```

#### E. Add Export/Save Functions
```typescript
async function handleExportPDF() {
  toast({
    title: "Export to PDF",
    description: "Preparing PDF export...",
  })
  
  const content = `
AI CLINICAL SUGGESTIONS
Patient ID: ${patientId}
Generated: ${new Date().toLocaleString()}

DIAGNOSIS: ${diagnosis}
SYMPTOMS: ${symptoms}
CONDITION: ${condition}

SUGGESTIONS:
${suggestions}

CHAT HISTORY:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}
  `
  
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `ai-suggestions-${patientId}-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function handleSaveToRecord() {
  try {
    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        doctorId: user?.id || (user as any)?._id,
        diagnosis,
        symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
        notes: `AI-Generated Suggestions:\n\n${suggestions}\n\n${notes}`,
        date: new Date().toISOString(),
      }),
    })
    
    const data = await res.json()
    
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Failed to save record")
    }
    
    toast({
      title: "Saved to Medical Records",
      description: "AI suggestions have been saved successfully",
    })
  } catch (err: any) {
    console.error("Save to record error", err)
    toast({
      title: "Error",
      description: err?.message || "Failed to save to medical records",
      variant: "destructive",
    })
  }
}
```

#### F. Update the Layout

Replace the entire JSX return statement. The key changes:

1. **Header**: Add Export and Save buttons
```tsx
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
    <Download className="w-4 h-4" />
    Export
  </Button>
  <Button variant="outline" size="sm" onClick={handleSaveToRecord} className="gap-2" disabled={!suggestions}>
    <Save className="w-4 h-4" />
    Save to Record
  </Button>
</div>
```

2. **Layout**: Change from `md:grid-cols-5` to `lg:grid-cols-3`
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Card className="lg:col-span-1">
    {/* Left sidebar */}
  </Card>
  <div className="lg:col-span-2">
    {/* Right tabbed content */}
  </div>
</div>
```

3. **Add Clinical Tools Buttons** (in left sidebar after form):
```tsx
<Separator className="my-4" />
<div className="space-y-2">
  <p className="text-sm font-medium">Clinical Tools</p>
  <div className="grid grid-cols-2 gap-2">
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => handleClinicalTool("diagnosis")}
      disabled={toolLoading !== null || !symptoms}
      className="gap-2"
    >
      {toolLoading === "diagnosis" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Stethoscope className="w-3 h-3" />
      )}
      Differential Dx
    </Button>
    
    {/* Repeat for other tools: interactions, dosage, literature */}
  </div>
</div>
```

4. **Add Patient Context Display** (in left sidebar after clinical tools):
```tsx
{patientContext && (
  <>
    <Separator className="my-4" />
    <div className="space-y-2">
      <p className="text-sm font-medium">Patient Context</p>
      <div className="text-xs space-y-1 text-muted-foreground">
        {patientContext.name && <p>• {patientContext.name}</p>}
        {patientContext.dateOfBirth && (
          <p>• Age: {Math.floor((Date.now() - new Date(patientContext.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>
        )}
        {patientContext.gender && <p>• Gender: {patientContext.gender}</p>}
        {patientContext.bloodGroup && <p>• Blood: {patientContext.bloodGroup}</p>}
        {patientContext.allergies?.length > 0 && (
          <p>• Allergies: {patientContext.allergies.join(", ")}</p>
        )}
      </div>
    </div>
  </>
)}
```

5. **Replace Right Content with Tabs**:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
  <TabsList className="grid grid-cols-5 w-full">
    <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
    <TabsTrigger value="chat" disabled={!suggestions}>Chat</TabsTrigger>
    <TabsTrigger value="diagnosis">Dx</TabsTrigger>
    <TabsTrigger value="interactions">Rx</TabsTrigger>
    <TabsTrigger value="literature">Research</TabsTrigger>
  </TabsList>

  {/* Add 5 TabsContent components for each tab */}
</Tabs>
```

## Testing After Implementation

1. **Basic Flow**:
   - ✅ Enter symptoms → Click Generate → See suggestions
   - ✅ Click Chat tab → Ask question → Get response
   - ✅ Reload page → Chat history persists

2. **Clinical Tools**:
   - ✅ Click "Differential Dx" → See diagnoses with probabilities
   - ✅ Click "Drug Interactions" → See medication safety analysis
   - ✅ Click "Dosage Calc" → See dosing recommendations
   - ✅ Click "Literature" → See research results

3. **Export/Save**:
   - ✅ Click Export → File downloads
   - ✅ Click Save → Toast confirms, check medical records

4. **Edge Cases**:
   - ✅ No symptoms → Differential Dx button disabled
   - ✅ No medications → Drug checker returns "No interactions"
   - ✅ Loading states → Spinners appear
   - ✅ Errors → Toast notifications show

## Common Issues & Solutions

### Issue: Tabs component not found
**Solution**: Check that shadcn/ui tabs component is installed:
```bash
npx shadcn-ui@latest add tabs
```

### Issue: Clinical tools returning fallback data
**Solution**: This is expected if GEMINI_API_KEY is not configured. The tools will still work with mock data.

### Issue: Patient context not loading
**Solution**: Ensure `/api/users/[id]` endpoint returns the full patient object including `medicalHistory`, `allergies`, etc.

### Issue: Chat not persisting
**Solution**: Check that `/api/ai-chats` endpoint is working and MongoDB `ai_chats` collection exists.

## Performance Tips

1. **Memoize expensive calculations**:
```typescript
const patientAge = useMemo(() => {
  if (!patientContext?.dateOfBirth) return null
  return Math.floor((Date.now() - new Date(patientContext.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}, [patientContext?.dateOfBirth])
```

2. **Debounce clinical tool calls** if adding auto-trigger features

3. **Use React.memo** for tab content if they become heavy

## Final Checklist

Before marking complete:
- [ ] All imports added
- [ ] All state variables added
- [ ] All new functions added
- [ ] Layout updated to 3-column
- [ ] Clinical tools buttons added
- [ ] Patient context display added
- [ ] Tabs interface implemented
- [ ] All 5 tab contents implemented
- [ ] Export function works
- [ ] Save function works
- [ ] Toast notifications work
- [ ] Error handling in place
- [ ] Loading states showing correctly
- [ ] Tested on mobile viewport
- [ ] Tested with/without Gemini API key
- [ ] Chat persistence verified
- [ ] Git commit with clear message

## Estimated Time

- **Setup**: 15 minutes (imports, state, functions)
- **Layout Update**: 30 minutes (restructure JSX)
- **Tab Contents**: 45 minutes (5 tabs × 9 minutes each)
- **Testing**: 30 minutes (manual testing all features)
- **Total**: ~2 hours for a developer familiar with the codebase

---

**Next Steps**: Start with Step 1 (backup), then methodically work through Steps 2A-2F. Test after each major section.

**Support**: Refer to `AI_SUGGESTIONS_PAGE_IMPROVEMENTS.md` for detailed explanations of each feature.
