# localStorage Migration Guide

## Current Status

The application now uses MongoDB for all primary data storage, but there are still some localStorage references that need attention.

## Remaining localStorage Usage

### 1. Authentication Tokens (Client-Side)
**Files affected:**
- `lib/auth-client.ts`
- `lib/auth-context.tsx`
- `app/login/page.tsx`

**Current behavior:**
```typescript
// Stores token in localStorage after login
localStorage.setItem("token", data.token)
localStorage.setItem("user", JSON.stringify(data.user))
```

**Migration strategy:**
The token is still stored in localStorage for client-side access. This is **acceptable for now** because:
- The actual session is validated on the server using MongoDB
- localStorage is only used for convenience (avoiding API calls)
- The token is validated against MongoDB sessions on every protected request

**Future improvement (Production):**
```typescript
// Option 1: Use HTTP-only cookies (recommended)
// Set cookie in API response
res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict`)

// Option 2: Use SessionStorage instead of localStorage
sessionStorage.setItem("token", data.token) // Cleared when browser closes
```

### 2. Legacy Storage Functions
**File:** `lib/storage.ts`

**Status:** ⚠️ **DEPRECATED** - Should be removed eventually

This file contains localStorage functions for:
- Mock data initialization
- User storage
- Medical records storage
- Prescriptions storage
- Appointments storage

**Migration plan:**
1. ✅ All API routes now use MongoDB (completed)
2. ✅ Client components fetch from API (completed)
3. ⚠️ Remove fallback imports in components
4. 🔜 Delete `lib/storage.ts` after confirming no usage

**How to check if safe to delete:**
```bash
# Search for imports
grep -r "from.*storage" --include="*.ts" --include="*.tsx"

# Search for localStorage usage
grep -r "localStorage" --include="*.ts" --include="*.tsx"
```

## Migration Checklist

### Phase 1: ✅ Completed
- [x] Create MongoDB session system
- [x] Update authentication routes
- [x] Add centralized logging
- [x] Update API routes to use MongoDB
- [x] Add loading skeletons
- [x] Add toast notifications

### Phase 2: ⚠️ In Progress
- [x] Authentication stores token in localStorage (acceptable)
- [x] Auth context syncs user from localStorage (acceptable)
- [ ] Remove `lib/storage.ts` file (after confirming no usage)
- [ ] Remove localStorage fallbacks in components

### Phase 3: 🔜 Future
- [ ] Implement HTTP-only cookies for tokens
- [ ] Add Redis for session caching
- [ ] Implement refresh token mechanism
- [ ] Add proper password hashing
- [ ] Add JWT token expiration

## Component-by-Component Status

### ✅ Fully Migrated (Uses MongoDB Only)
- `app/api/auth/login/route.ts` - MongoDB sessions
- `app/api/auth/signup/route.ts` - MongoDB sessions
- `app/api/appointments/**` - MongoDB only
- `app/api/medical-records/**` - MongoDB only
- `app/api/prescriptions/**` - MongoDB only

### ⚠️ Partially Migrated (localStorage for tokens only)
- `lib/auth-client.ts` - Stores token locally for convenience
- `lib/auth-context.tsx` - Reads user from localStorage on mount
- `components/dashboards/patient-dashboard.tsx` - Has fallback to storage.ts

### 🔜 To Be Updated
None critical - all data flows through MongoDB APIs

## How to Complete Migration

### Step 1: Verify No Direct localStorage Data Usage
```bash
# Check for storage.ts imports
grep -r "from.*storage" app/ components/ lib/

# Should only find auth-related files
```

### Step 2: Remove Storage.ts Fallbacks
Find and remove code like:
```typescript
// ❌ Remove this
import { saveUser } from '@/lib/storage'
saveUser(user)

// ✅ Already done - API calls
await fetch('/api/users', { method: 'POST', body: JSON.stringify(user) })
```

### Step 3: Update Auth to Use Cookies (Production)

**Add cookie utilities:**
```typescript
// lib/cookies.ts
import { cookies } from 'next/headers'

export async function setAuthCookie(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function getAuthCookie() {
  return cookies().get('auth_token')?.value
}

export async function clearAuthCookie() {
  cookies().delete('auth_token')
}
```

**Update login route:**
```typescript
// app/api/auth/login/route.ts
import { setAuthCookie } from '@/lib/cookies'

// After session creation
await setAuthCookie(token)

return NextResponse.json({
  success: true,
  message: "Login successful",
  user: { /* user data */ }
  // Don't send token in response
})
```

**Update client auth:**
```typescript
// lib/auth-client.ts
export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await response.json()
  // No need to store token - it's in cookie
  return data
}
```

## Testing After Migration

### Test Scenarios:
1. **Login Flow**
   - User logs in
   - Session created in MongoDB
   - Token stored appropriately (localStorage or cookie)
   - User can access protected routes

2. **Data Persistence**
   - Create medical record
   - Refresh page
   - Data still visible (from MongoDB, not localStorage)

3. **Logout Flow**
   - User logs out
   - Session deleted from MongoDB
   - Token removed from client
   - Redirect to login page

4. **Session Expiration**
   - Wait 7 days or manually expire session in DB
   - User should be logged out automatically
   - Redirect to login page

## Security Considerations

### ✅ Already Implemented:
- MongoDB session storage
- Server-side session validation
- Session expiration
- Structured logging for audit trails

### 🔜 Next Security Steps:
1. **Password Hashing**
   ```bash
   npm install bcrypt @types/bcrypt
   ```

2. **HTTPS Only** (production)
   - Secure cookies require HTTPS
   - Use environment variables

3. **CSRF Protection**
   ```bash
   npm install csrf
   ```

4. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

## Performance Optimization

### Current Architecture:
```
Client Request → API Route → MongoDB → Response → Client
```

### Future Optimization:
```
Client Request → API Route → Redis Cache → MongoDB → Response → Client
                                ↓
                          (Cache Hit - Fast)
```

**Benefits of Redis:**
- Faster session validation
- Reduced MongoDB queries
- Better scalability

## Summary

### ✅ What's Done:
- MongoDB is the primary data store
- All API routes use MongoDB
- Session management in MongoDB
- Logging system in place
- Loading states and toasts added

### ⚠️ What's Acceptable:
- localStorage used for auth tokens (client convenience)
- Token is always validated against MongoDB sessions

### 🔜 What's Next:
- Implement HTTP-only cookies (production)
- Add password hashing
- Remove lib/storage.ts file
- Add Redis for caching

**Bottom line:** The migration is functionally complete. The remaining localStorage usage is for client-side convenience and doesn't compromise the MongoDB-first architecture.
