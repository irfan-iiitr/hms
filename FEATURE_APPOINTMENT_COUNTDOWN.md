# Appointment Countdown + Quick Actions

Real-time countdown timer for next appointment with reschedule and cancel quick actions.

## 🎯 Feature Overview

A prominent, auto-updating countdown card displayed on the patient dashboard that shows:
- **Real-time countdown** (days, hours, minutes) to next scheduled appointment
- **Urgency indicators** with color-coded risk levels
- **Quick action buttons** for reschedule and cancel
- **Smart date formatting** (e.g., "Today in 2h 30m", "Tomorrow", "3 days, 5h")
- **Contextual alerts** for imminent appointments

---

## 🏗️ Architecture

### Components Created

#### 1. **`lib/date-utils.ts`** - Date calculation utilities
Core logic for countdown timers, date formatting, and urgency calculations.

**Key Functions:**
- `getTimeRemaining(targetDate)` - Returns structured time object
- `formatCountdown(timeRemaining)` - Human-readable countdown string
- `getUrgencyLevel(timeRemaining)` - Risk classification (critical/high/medium/low/past)
- `combineDateTime(date, time)` - Merge appointment date + time
- `formatAppointmentDate/Time()` - Display formatting

**Time Remaining Object:**
```typescript
{
  days: number
  hours: number
  minutes: number  
  seconds: number
  totalMilliseconds: number
  isPast: boolean
  isToday: boolean
  isTomorrow: boolean
  isWithin24Hours: boolean
  isWithinWeek: boolean
}
```

#### 2. **`app/api/appointments/[id]/route.ts`** - Extended PATCH handler
Updated to support cancellation with metadata tracking.

**New Features:**
- Tracks `cancelledAt` timestamp
- Captures `cancellationReason` from patient
- Maintains audit trail for cancelled appointments

#### 3. **`components/appointment-countdown-card.tsx`** - Main UI component
Rich countdown card with real-time updates and quick actions.

**Features:**
- Auto-updates every second
- Color-coded urgency states
- Collapsible cancel dialog with reason capture
- Reschedule button (placeholder for navigation)
- Past appointment handling
- Loading states

---

## 🎨 Visual Design

### Urgency Levels & Colors

| Level | Condition | Border/BG Color | Badge Color |
|-------|-----------|-----------------|-------------|
| **Critical** | < 1 hour | Red | Red |
| **High** | Today or < 24h | Orange | Orange |
| **Medium** | < 3 days | Yellow | Yellow |
| **Low** | ≥ 3 days | Blue | Blue |
| **Past** | Already passed | Gray | Gray |

### Smart Countdown Formatting

```
"Starting now!" - less than 1 minute
"Today in 2h 30m" - same day
"Tomorrow at 10:00 AM" - next day
"3 days, 5h" - multiple days
"2 days ago" - past appointments
```

---

## 📱 User Experience

### Dashboard Display

```
┌────────────────────────────────────────────┐
│ 🗓️  Next Appointment          [HIGH]       │
│ Follow-up for hypertension                 │
│                                            │
│ ┌────────────────────────────────────┐    │
│ │      ⚠️ Appointment starting soon   │    │
│ │                                     │    │
│ │         Today in 2h 30m             │    │
│ │            TIMEREMAINING            │    │
│ └────────────────────────────────────┘    │
│                                            │
│ 📅 Monday, November 11, 2025               │
│ 🕐 2:00 PM                                 │
│                                            │
│ [📝 Reschedule]  [❌ Cancel]               │
└────────────────────────────────────────────┘
```

### Quick Actions

**Reschedule:**
- Currently shows alert (placeholder)
- Can be extended to navigate to appointments page with pre-filled data
- Future: Inline date/time picker

**Cancel:**
- Opens confirmation dialog
- Optional reason field (multi-line)
- "Keep Appointment" vs "Cancel Appointment" buttons
- Updates status to "cancelled" via API
- Refreshes dashboard automatically

---

## 🔄 Real-Time Updates

The countdown **auto-updates every second** using React intervals:

```typescript
useEffect(() => {
  const updateCountdown = () => {
    setTimeRemaining(getTimeRemaining(appointmentDateTime))
  }
  
  updateCountdown() // Initial
  const interval = setInterval(updateCountdown, 1000) // Every second
  
  return () => clearInterval(interval) // Cleanup
}, [appointmentDateTime])
```

**Performance Notes:**
- Uses efficient date math (no heavy computations)
- Cleanup on unmount prevents memory leaks
- Only renders if appointment exists

---

## 🚀 Integration

### Patient Dashboard Flow

1. **Dashboard loads** → Fetches appointments
2. **If scheduled appointment exists** → Renders countdown card prominently (above main grid)
3. **Countdown updates** → Every second, recalculates time remaining
4. **User clicks "Cancel"** → Opens dialog
5. **User confirms** → PATCH `/api/appointments/:id` with `status: "cancelled"`
6. **Callback fires** → Refreshes appointment list, shows toast

### Code Integration

```typescript
{appointments.filter((a) => a.status === "scheduled").length > 0 && (
  <div className="mb-8">
    <AppointmentCountdownCard
      appointment={appointments.filter((a) => a.status === "scheduled")[0]}
      onUpdate={(updatedAppointment) => {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
        )
      }}
      onCancel={(appointmentId) => {
        // Refresh from server
        fetchAppointmentsByPatient(patientId).then(setAppointments)
        toast({ title: "Appointment cancelled" })
      }}
    />
  </div>
)}
```

---

## 📋 API Usage

### Cancel Appointment

**Request:**
```http
PATCH /api/appointments/:id
Content-Type: application/json

{
  "status": "cancelled",
  "cancellationReason": "Feeling better, no longer need visit"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "_id": "...",
    "patientId": "...",
    "doctorId": "...",
    "date": "2025-11-15T10:00:00.000Z",
    "time": "10:00 AM",
    "status": "cancelled",
    "cancelledAt": "2025-11-09T14:23:15.000Z",
    "cancellationReason": "Feeling better, no longer need visit",
    "updatedAt": "2025-11-09T14:23:15.000Z"
  }
}
```

### Reschedule (Future Implementation)

```http
PATCH /api/appointments/:id
Content-Type: application/json

{
  "date": "2025-11-20T10:00:00.000Z",
  "time": "10:00 AM",
  "reason": "Rescheduled by patient"
}
```

---

## 🎯 Key Features

### ✅ Completed

- [x] Real-time countdown with second-by-second updates
- [x] Urgency-based color coding (5 levels)
- [x] Smart date/time formatting
- [x] Cancel with reason capture
- [x] Past appointment handling
- [x] Loading states
- [x] Responsive design
- [x] API integration
- [x] Toast notifications
- [x] Automatic refresh on cancellation

### 🔮 Future Enhancements

- [ ] **Inline reschedule** - Date/time picker in modal
- [ ] **Calendar integration** - Add to Google/Apple/Outlook calendar
- [ ] **Reminders** - SMS/email alerts at intervals (24h, 1h, 15m)
- [ ] **Directions** - Map to provider location
- [ ] **Prep checklist** - Link to appointment prep pack
- [ ] **Video join** - Direct link for telehealth appointments
- [ ] **Check-in** - Early check-in option (15 min before)
- [ ] **Doctor info** - Quick view of provider details
- [ ] **History** - View past cancellations/reschedules

---

## 🔒 Safety & UX

### Confirmations
- **Cancel** requires explicit confirmation dialog
- Optional reason field (not required, but helpful for analytics)
- Clear "Keep Appointment" option to prevent accidental cancellations

### Edge Cases Handled
- ✅ No appointments → Card doesn't render
- ✅ Past appointments → Shows "Appointment Passed" with informational alert
- ✅ Already cancelled → Shows cancelled badge, no action buttons
- ✅ Multiple scheduled → Shows only the **next** (first) appointment
- ✅ Same-day appointments → Special "Today" formatting
- ✅ Invalid time formats → Graceful parsing with fallback

### Accessibility
- Color-coded + text labels (not color-only)
- Keyboard navigation support (dialog, buttons)
- Screen reader friendly labels
- High contrast urgency indicators

---

## 📁 File Structure

```
lib/
  └── date-utils.ts           ✅ NEW - Date/time utilities

app/api/appointments/
  └── [id]/
      └── route.ts            ✅ UPDATED - Added cancellation metadata

components/
  ├── appointment-countdown-card.tsx  ✅ NEW - Countdown UI
  └── dashboards/
      └── patient-dashboard.tsx       ✅ UPDATED - Integration
```

---

## 🧪 Testing Checklist

### Manual Tests

- [ ] **Past appointment** - Shows "Passed" with gray styling
- [ ] **Today (hours away)** - Shows "Today in Xh Ym"
- [ ] **Today (minutes away)** - Shows "Today in Ym"
- [ ] **Tomorrow** - Shows "Tomorrow"
- [ ] **Multiple days** - Shows "X days, Yh"
- [ ] **Cancel action** - Opens dialog, requires confirmation
- [ ] **Cancel with reason** - Saves reason to database
- [ ] **Cancel without reason** - Works with default message
- [ ] **Reschedule button** - Shows alert (placeholder)
- [ ] **Auto-update** - Countdown decreases every second
- [ ] **Urgency colors** - Changes as time approaches
- [ ] **Critical alert** - Red alert when < 1 hour
- [ ] **Multiple scheduled** - Shows only next appointment
- [ ] **No appointments** - Card doesn't render

---

## 💡 Usage Examples

### Basic Display
Patient logs in → Next appointment is in 5 days → Card shows blue border, "5 days, 3h" countdown

### Urgent Appointment
Appointment is in 45 minutes → Card shows red border, critical badge, alert banner, "Today in 45m"

### Cancellation Flow
1. Click "Cancel" button
2. Dialog opens with optional reason field
3. User types "Doctor rescheduled"
4. Clicks "Cancel Appointment"
5. API updates status to "cancelled"
6. Dashboard refreshes, countdown card disappears
7. Toast: "Appointment cancelled successfully"

---

## 🎉 Benefits

### For Patients
- **Never miss appointments** - Constant visual reminder
- **Reduce anxiety** - Clear countdown shows exactly how much time left
- **Quick actions** - Cancel/reschedule without navigating away
- **Context-aware** - Urgency indicators help prioritize

### For Providers
- **Fewer no-shows** - Visible countdown increases attendance
- **Cancellation data** - Track reasons for cancellations
- **Better scheduling** - Advance notice of cancellations allows rebooking

---

## 📊 Metrics to Track

- Appointment attendance rate (before/after countdown feature)
- Cancellation rate and average notice period
- Reschedule rate
- Click-through rate on quick actions
- Time spent on dashboard vs appointments page

---

## 🚀 Quick Start

The feature is **fully integrated** and active immediately:

1. **Login as patient** with upcoming appointment
2. **Dashboard** displays countdown prominently
3. **Watch countdown** update in real-time
4. **Test cancel** button (opens dialog)
5. **Test reschedule** button (shows alert)

No configuration needed! Just ensure appointments have valid `date` and `time` fields.
