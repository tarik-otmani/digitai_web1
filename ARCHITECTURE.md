# Architecture Overview - Supabase Authentication

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                           │
│                                                                     │
│  ┌──────────────────┐                    ┌──────────────────┐      │
│  │  Login Page      │                    │ Register Page    │      │
│  │ (Login.tsx)      │                    │ (Register.tsx)   │      │
│  └────────┬─────────┘                    └────────┬─────────┘      │
│           │                                       │                 │
│           │ Email + Password                      │ Email + Password│
│           ▼                                       ▼                 │
│  ┌──────────────────────────────────────────────────┐              │
│  │      AuthContext / API Client (api.ts)         │              │
│  └─────────────────┬──────────────────────────────┘              │
└────────────────────┼──────────────────────────────────────────────┘
                     │
                     │ POST /api/auth/login
                     │ POST /api/auth/register
                     │ GET /api/auth/me
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                      │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │               webapp/routes/api.js                         │    │
│  │  - POST /auth/register                                     │    │
│  │  - POST /auth/login                                        │    │
│  │  - GET /auth/me                                            │    │
│  └──────────────────┬─────────────────────────────────────────┘    │
│                     │                                               │
│  ┌──────────────────▼─────────────────┐                            │
│  │    webapp/lib/auth.js              │                            │
│  │  - hashPassword()                  │                            │
│  │  - verifyPassword()                │                            │
│  │  - signToken()                     │                            │
│  │  - verifyToken()                   │                            │
│  └──────────────────────────────────┬─┘                            │
│                                      │                              │
│  ┌──────────────────────────────────▼─────────────────────────┐    │
│  │    webapp/lib/userStore.js (NOW WITH SUPABASE)             │    │
│  │  - getUsers()                                              │    │
│  │  - getUserByEmail()                                        │    │
│  │  - getUserById()                                           │    │
│  │  - addUser()                                               │    │
│  └───────────────────────────────────┬──────────────────────┘    │
└──────────────────────────────────────┼─────────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │      HTTP/HTTPS Connection         │
                    │   (Secure over TLS/SSL)            │
                    └──────────────────┬──────────────────┘
                                       │
┌──────────────────────────────────────▼─────────────────────────────┐
│                    SUPABASE (Cloud Database)                       │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              public.auth_users Table                       │   │
│  │                                                             │   │
│  │  Columns:                                                   │   │
│  │  - id (BIGSERIAL PRIMARY KEY)                              │   │
│  │  - username (VARCHAR, UNIQUE)                              │   │
│  │  - email (VARCHAR, UNIQUE)                                 │   │
│  │  - password_hash (VARCHAR)                                 │   │
│  │  - created_at (TIMESTAMP)                                  │   │
│  │  - updated_at (TIMESTAMP)                                  │   │
│  │                                                             │   │
│  │  Indexes:                                                   │   │
│  │  - idx_auth_users_email (fast email lookups)               │   │
│  │  - idx_auth_users_username (fast username lookups)         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Features:                                                         │
│  ✅ Automatic daily backups                                       │
│  ✅ 99.9% SLA uptime guarantee                                    │
│  ✅ Encrypted at rest                                             │
│  ✅ Real-time data access                                         │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Registration Flow

```
1. User enters email & password
   │
2. Frontend sends POST /api/auth/register
   │
3. Backend receives request
   ├─ Validate email format
   ├─ Check password length (min 6 chars)
   │
4. Query Supabase: getUserByEmail()
   ├─ If exists → Error: "Email already registered"
   └─ If not exists → Continue
   │
5. Hash password with scrypt + random salt
   │
6. Insert into auth_users table
   ├─ username: derived from name or email
   ├─ email: normalized (lowercase)
   ├─ password_hash: scrypt(password + salt)
   │
7. Generate JWT token
   ├─ Contains: user_id, email
   ├─ Expires: 7 days
   │
8. Return success + token to frontend
   │
9. Frontend stores token (in secure HTTP-only cookie or local storage)
   │
10. User is now logged in ✅
```

### Login Flow

```
1. User enters email & password
   │
2. Frontend sends POST /api/auth/login
   │
3. Backend receives request
   ├─ Validate email is provided
   ├─ Validate password is provided
   │
4. Query Supabase: getUserByEmail(email)
   ├─ If not found → Error: "Invalid email or password"
   └─ If found → Continue
   │
5. Verify password
   ├─ Hash submitted password with same salt
   ├─ Compare with stored password_hash
   │
6. If password matches
   ├─ Generate JWT token
   ├─ Return success + token + user info
   │
7. Frontend receives token
   ├─ Stores securely
   ├─ Adds to Authorization header for future requests
   │
8. User is now authenticated ✅
```

### Token Verification Flow

```
1. User makes authenticated request
   │
2. Frontend includes Authorization header
   ├─ Value: "Bearer <jwt_token>"
   │
3. Backend receives request
   ├─ Extract token from Authorization header
   │
4. Verify JWT signature
   ├─ Uses JWT_SECRET from env vars
   ├─ If invalid → Error: "Invalid or expired token"
   │
5. Extract payload (user_id, email)
   │
6. Query Supabase: getUserById(user_id)
   │
7. Return user information
   │
8. Request is authorized ✅
```

## Security Layers

```
Layer 1: Network Security
├─ HTTPS/TLS encryption for all connections
├─ Secure WebSocket for real-time features
└─ DDoS protection via Supabase CDN

Layer 2: Authentication
├─ JWT tokens with 7-day expiration
├─ Tokens must be provided for protected routes
└─ Token signature verified on every request

Layer 3: Password Security
├─ Scrypt hashing algorithm (resistant to GPU attacks)
├─ Random salt per password (prevents rainbow tables)
├─ Min 6 characters (enforced on backend)
└─ NEVER stored in plaintext

Layer 4: Database Security
├─ Encrypted at rest (AES-256)
├─ Encrypted in transit (TLS)
├─ Automatic backup encryption
└─ Row-level security (RLS) available

Layer 5: Environment Security
├─ Secrets stored in Vercel environment variables
├─ Service role key never exposed to frontend
├─ Anonymous key (if used) is read-only
└─ Automatic secret rotation support
```

## Environment Variables

```
Backend uses:
├─ SUPABASE_URL
│  └─ Your Supabase project URL
│
├─ SUPABASE_SERVICE_ROLE_KEY
│  └─ Admin key for full database access
│  └─ ⚠️ NEVER expose to frontend
│
├─ JWT_SECRET
│  └─ Secret for signing JWT tokens
│  └─ Change before production
│
└─ Optional: SUPABASE_ANON_KEY
   └─ Public key (safe to use in browser)
   └─ Only if implementing frontend auth
```

## Error Handling

```
Client Errors (4xx):
├─ 400 Bad Request
│  └─ Missing required fields
│  └─ Invalid email format
│  └─ Password too short
│
└─ 401 Unauthorized
   ├─ Invalid credentials
   ├─ Missing token
   └─ Expired token

Server Errors (5xx):
├─ 500 Internal Server Error
│  ├─ Database connection failure
│  ├─ Password hashing error
│  ├─ Token generation error
│  └─ Unexpected exceptions
```

## Performance Considerations

```
Query Optimization:
├─ Email lookups: O(1) with indexed column
├─ Prepared statements prevent SQL injection
├─ Connection pooling for multiple requests
└─ Batch operations when possible

Caching Strategy:
├─ JWT tokens cached in browser (7 days)
├─ User data cached after login
├─ Database handles query caching
└─ No in-memory user cache needed (stateless)

Scalability:
├─ No session storage needed (JWT stateless)
├─ Multiple backend servers can serve same users
├─ Supabase handles horizontal scaling
└─ No shared session database needed
```

## Files and Their Purposes

```
webapp/lib/
├─ userStore.js         ← Database queries (UPDATED for Supabase)
├─ auth.js              ← Password hashing & JWT (unchanged)
└─ store.js             ← Course data storage

webapp/routes/
├─ api.js               ← Express routes for auth endpoints

new-frontend/src/
├─ pages/
│  ├─ Login.tsx         ← Login form UI
│  └─ Register.tsx      ← Registration form UI
├─ contexts/
│  └─ AuthContext.tsx   ← Auth state management
└─ api.ts               ← API client for backend calls

scripts/
└─ auth_users_setup.sql ← SQL to create database table

Documentation:
├─ QUICK_START.md       ← Quick setup guide
├─ SUPABASE_SETUP.md    ← Detailed setup & troubleshooting
├─ INTEGRATION_SUMMARY.md ← What changed in the code
└─ ARCHITECTURE.md      ← This file
```

## Deployment Architecture

```
Development:
  Frontend (localhost:3000)
    ↓
  Backend (localhost:5000)
    ↓
  Supabase (cloud.supabase.io)

Production (Vercel + Supabase):
  Frontend (your-domain.vercel.app)
    ↓
  Backend (api.your-domain.vercel.app)
    ↓
  Supabase (cloud.supabase.io)

All data flows through HTTPS/TLS encryption
```

---

**This architecture provides:**
- ✅ Secure user authentication
- ✅ Scalable to millions of users
- ✅ Enterprise-grade security
- ✅ Zero session management complexity
- ✅ Automatic backups and disaster recovery
