# Quick Start Guide - Updated Application

## What's New? 🎉

Your HealthFlow HMS application has been significantly improved with:

1. ✅ **MongoDB Session Management** - Secure authentication
2. ✅ **Centralized Logging** - Better debugging and monitoring
3. ✅ **Loading Skeletons** - Professional loading states
4. ✅ **Toast Notifications** - User-friendly feedback

---

## Prerequisites

- Node.js 18+ installed
- MongoDB connection string
- pnpm (or npm/yarn) installed

---

## Installation & Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key

# Environment
NODE_ENV=development
```

### 3. Run the Development Server
```bash
pnpm dev
```

Navigate to: `http://localhost:3000`

---

## New Features Usage

### 🔒 Authentication

**Login/Signup now uses MongoDB sessions:**
```
User logs in → Session created in MongoDB → Token returned
                                ↓
                    Valid for 7 days, stored in localStorage
```

**Logout:**
```typescript
// Deletes session from MongoDB
POST /api/auth/logout
Authorization: Bearer <token>
```

### 📊 Logging

**Automatic logging in all API routes:**
```typescript
// Example: API call logged
2024-11-09T10:30:45.123Z [Server] [INFO] API POST /api/appointments | {"patientId":"abc123"}

// Example: Database operation logged
2024-11-09T10:30:45.456Z [Server] [DEBUG] DB insertOne on appointments | {"id":"xyz789"}

// Example: Error logged
2024-11-09T10:30:45.789Z [Server] [ERROR] Failed to create appointment | {"error":"Validation failed"}
```

**View logs in:**
- Terminal where dev server is running
- Browser console (client-side logs)

### ⏳ Loading States

**Patient Dashboard automatically shows skeletons while loading:**
```tsx
// Loading stats
[█████████...] [█████████...] [█████████...]

// Loading medical records
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │
│ ▓▓▓▓▓▓▓▓▓                   │
└─────────────────────────────┘
```

### 🔔 Toast Notifications

**Examples of toast notifications:**

**Success:**
```
✅ Profile updated
Your medical information has been successfully saved.
```

**Error:**
```
❌ Upload failed
Failed to upload file. Please try again.
```

**Info:**
```
ℹ️ Reschedule feature
Navigate to appointments page to reschedule.
```

---

## Testing the Application

### Test User Credentials

Create test users via signup or use existing MongoDB data:

**Patient:**
```
Email: patient@test.com
Password: password123
```

**Doctor:**
```
Email: doctor@test.com
Password: password123
```

**Admin:**
```
Email: admin@test.com
Password: password123
```

### Test Scenarios

#### 1. Login Flow
1. Go to `http://localhost:3000/login`
2. Enter credentials
3. ✅ Watch for toast: "Login successful"
4. ✅ Redirected to dashboard
5. ✅ Session created in MongoDB

#### 2. Loading States
1. Log in as patient
2. ✅ See skeleton loaders while data fetches
3. ✅ Skeletons replaced with actual data
4. ✅ Smooth transition

#### 3. Profile Update
1. Click "Update Profile"
2. Fill in blood group, allergies
3. Click "Save Profile"
4. ✅ Toast: "Profile updated"
5. ✅ Data saved to MongoDB

#### 4. File Upload
1. Click "Upload Medical Files"
2. Select a file (PDF, image)
3. Click "Upload"
4. ✅ Toast: "File uploaded successfully"
5. ✅ File processed by AI (if API key configured)

#### 5. Appointment Cancellation
1. View appointment countdown card
2. Click "Cancel"
3. Enter reason (optional)
4. Click "Cancel Appointment"
5. ✅ Toast: "Appointment cancelled"
6. ✅ Status updated in MongoDB

---

## Monitoring & Debugging

### View Logs

**Terminal (Server logs):**
```bash
# All logs appear in the terminal where you ran 'pnpm dev'
2024-11-09T10:30:45.123Z [Server] [INFO] API POST /api/appointments
```

**Browser Console (Client logs):**
```javascript
// Open DevTools → Console
[Client] [INFO] User logged in
```

### Debug Session Issues

**Check MongoDB sessions:**
```bash
# Connect to MongoDB
mongosh <your_connection_string>

# View sessions
use Cluster0
db.sessions.find().pretty()

# Check specific session
db.sessions.findOne({ token: "your_token_here" })
```

### Debug Loading Issues

**Check network tab:**
1. Open DevTools → Network
2. Filter by "Fetch/XHR"
3. Look for API calls
4. Check response times and data

---

## Architecture Overview

### Before:
```
┌─────────────┐
│ localStorage│ ← Insecure, client-only
└─────────────┘
```

### After:
```
┌────────────┐      ┌─────────────┐      ┌──────────┐
│   Client   │ ←──→ │  API Routes │ ←──→ │ MongoDB  │
│            │      │   + Logging │      │ Sessions │
│ Toasts     │      │             │      │ Users    │
│ Skeletons  │      │  Validation │      │ Records  │
└────────────┘      └─────────────┘      └──────────┘
```

---

## Common Issues & Solutions

### Issue: "Session not found"
**Solution:**
- Token expired (7 days)
- Clear localStorage and login again
- Check MongoDB connection

### Issue: Loading skeletons don't disappear
**Solution:**
- Check network tab for failed API calls
- Verify MongoDB connection
- Check server logs for errors

### Issue: Toasts not appearing
**Solution:**
- Check that `<Toaster />` is in layout
- Verify `useToast()` import
- Check console for errors

### Issue: Slow loading
**Solution:**
- Check MongoDB Atlas region (latency)
- Add indexes to collections
- Consider Redis caching (future)

---

## Next Steps

### Immediate (Recommended):
1. **Set up test data** in MongoDB
2. **Test all features** with different user roles
3. **Monitor logs** for any errors
4. **Test on different devices** (mobile/desktop)

### Short-term:
1. **Add password hashing** (bcrypt)
2. **Implement JWT** tokens
3. **Add HTTP-only cookies**
4. **Set up proper environment variables**

### Long-term:
1. **Add Redis** for session caching
2. **Implement rate limiting**
3. **Add comprehensive tests**
4. **Deploy to production**

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with MongoDB session
- `POST /api/auth/signup` - Register with MongoDB session
- `POST /api/auth/logout` - Delete session from MongoDB

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user

### Medical Records
- `GET /api/medical-records?patientId=xxx` - Get records
- `POST /api/medical-records` - Create record

### Appointments
- `GET /api/appointments?patientId=xxx` - Get appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment

### Prescriptions
- `GET /api/prescriptions?patientId=xxx` - Get prescriptions
- `POST /api/prescriptions` - Create prescription

---

## File Structure

```
app/
  ├── api/
  │   ├── auth/
  │   │   ├── login/ ✅ Updated
  │   │   ├── signup/ ✅ Updated
  │   │   └── logout/ ✨ NEW
  │   ├── appointments/ ✅ Updated
  │   ├── medical-records/ ✅ Updated
  │   └── prescriptions/ ✅ Updated
  └── dashboard/
      └── (role-based dashboards)

lib/
  ├── logger.ts ✨ NEW
  ├── session.ts ✨ NEW
  ├── auth-middleware.ts ✨ NEW
  ├── db.ts ✅ MongoDB connection
  └── types.ts ✅ TypeScript types

components/
  ├── ui/
  │   └── loading-skeletons.tsx ✨ NEW
  └── dashboards/
      └── patient-dashboard.tsx ✅ Updated
```

---

## Support & Documentation

- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Migration Guide:** `LOCALSTORAGE_MIGRATION_GUIDE.md`
- **This Guide:** `QUICK_START_GUIDE.md`

---

## Checklist for Going Live

- [ ] Add password hashing (bcrypt)
- [ ] Implement JWT with refresh tokens
- [ ] Use HTTP-only cookies for tokens
- [ ] Set up environment variables properly
- [ ] Add rate limiting
- [ ] Add input validation (Zod)
- [ ] Enable CORS for production domain
- [ ] Set up MongoDB indexes
- [ ] Add Redis for caching
- [ ] Configure SSL/TLS
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Add comprehensive logging
- [ ] Test on production-like environment
- [ ] Backup strategy for MongoDB

---

## Need Help?

- Check the logs (terminal + browser console)
- Review the implementation summary
- Test with demo credentials
- Verify MongoDB connection

**Your application is now more secure, maintainable, and user-friendly!** 🎉
