# Admin Authentication Implementation Plan

## Overview
This document outlines the plan to implement username/password authentication for admin routes in the pandidorty-react-router application using React Router v7, Drizzle ORM, and PostgreSQL.

## Current State
- **Framework**: React Router v7
- **Database**: PostgreSQL with Drizzle ORM
- **Existing Tables**: Users table already exists with email, password fields
- **Admin Routes**: `/admin/*` routes exist but are currently unprotected
- **No existing authentication system**

## Implementation Plan

### Phase 1: Database Schema Updates
1. **Add Sessions Table**
   - Create a new sessions table for managing user sessions
   - Fields: id, userId, token, expiresAt, createdAt
   - Add appropriate indexes for performance

2. **Update Users Table**
   - Password field already exists
   - Consider adding: lastLogin, failedLoginAttempts, lockedUntil

### Phase 2: Authentication Core
1. **Create Auth Utilities** (`app/utils/auth.server.ts`)
   - Password hashing using native crypto API (crypto.scrypt)
   - Session token generation
   - Session validation
   - User authentication functions

2. **Session Management** (`app/utils/session.server.ts`)
   - Cookie-based session management
   - Session creation/destruction
   - Session validation middleware

### Phase 3: Authentication Routes
1. **Login Route** (`app/routes/admin/login.tsx`)
   - Login form with username/password
   - Form validation using react-hook-form + zod
   - Server-side authentication
   - Session creation on successful login
   - Redirect to admin dashboard

2. **Logout Route** (`app/routes/admin/logout.tsx`)
   - Session destruction
   - Cookie cleanup
   - Redirect to login

### Phase 4: Route Protection
1. **Auth Guard/Middleware**
   - Create authentication check for all admin routes
   - Implement in React Router v7 loader functions
   - Redirect to login if not authenticated
   - Pass user data to authenticated routes

2. **Protected Admin Routes**
   - Update all admin route loaders to check authentication
   - Routes to protect:
     - `/admin` (dashboard)
     - `/admin/orders`
     - Future admin routes

### Phase 5: User Management
1. **Initial Admin User**
   - Create seed script for initial admin user
   - Secure password generation

2. **User Management UI** (Future)
   - CRUD operations for admin users
   - Password reset functionality
   - User activation/deactivation

## Technical Implementation Details

### Authentication Flow
1. User visits `/admin/*` route
2. Loader checks for valid session cookie
3. If no valid session, redirect to `/admin/login`
4. User submits login form
5. Server validates credentials
6. On success: create session, set cookie, redirect to admin
7. On failure: show error message

### Security Considerations
1. **Password Security**
   - Use crypto.scrypt for password hashing
   - Implement rate limiting for login attempts
   - Account lockout after failed attempts

2. **Session Security**
   - HTTPOnly cookies
   - Secure flag in production
   - SameSite=Lax
   - Session expiration
   - Token rotation on activity

3. **CSRF Protection**
   - Implement CSRF tokens for forms
   - Validate on server side

### File Structure
```
app/
├── utils/
│   ├── auth.server.ts        # Auth utilities
│   ├── session.server.ts     # Session management
│   └── db.server.ts         # Database utilities
├── routes/
│   └── admin/
│       ├── login.tsx        # Login page
│       ├── logout.tsx       # Logout handler
│       ├── index.tsx        # Dashboard (protected)
│       └── orders.tsx       # Orders (protected)
├── db/
│   └── schema.ts           # Update with sessions table
└── components/
    └── admin/
        └── AuthGuard.tsx   # Auth wrapper component
```

## Migration Steps

### Step 1: Database Migration
```sql
-- Create sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Update users table
ALTER TABLE users 
ADD COLUMN last_login TIMESTAMP,
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP;
```

### Step 2: Environment Variables
Add to `.env`:
```
SESSION_SECRET=<generate-secure-random-string>
SESSION_MAX_AGE=86400  # 24 hours in seconds
```

## Implementation Timeline
1. **Day 1**: Database updates, auth utilities
2. **Day 2**: Session management, login/logout routes
3. **Day 3**: Route protection, testing
4. **Day 4**: Security hardening, documentation

## Testing Plan
1. Unit tests for auth utilities
2. Integration tests for login/logout flow
3. Security testing (invalid credentials, session hijacking)
4. Load testing for session management

## Future Enhancements
1. Two-factor authentication
2. OAuth integration
3. Role-based access control (RBAC)
4. Audit logging
5. Password reset via email
6. Remember me functionality

## Dependencies to Add
```json
{
  "dependencies": {
    "@types/cookie": "^0.6.0",
    "cookie": "^0.7.2"
  }
}
```

## Success Criteria
- [ ] Admin routes require authentication
- [ ] Secure password storage
- [ ] Session management with cookies
- [ ] Login/logout functionality
- [ ] Protection against common attacks
- [ ] Good user experience with proper redirects 