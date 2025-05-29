# Admin Authentication Implementation Guide

## Quick Start

### 1. Apply Database Migration
```bash
# Run the migration
npx drizzle-kit push

# Or if you have a migration script
npm run db:migrate
```

### 2. Install Required Dependencies
```bash
npm install cookie
npm install --save-dev @types/cookie
```

### 3. Create Authentication Utilities

#### `app/utils/auth.server.ts`
```typescript
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { success: false, error: "Account is locked. Try again later." };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    // Increment failed attempts
    const attempts = user.failedLoginAttempts + 1;
    const updates: any = { failedLoginAttempts: attempts };
    
    // Lock account if max attempts reached
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_TIME);
      updates.failedLoginAttempts = 0;
    }
    
    await db.update(users).set(updates).where(eq(users.id, user.id));
    
    return { success: false, error: "Invalid credentials" };
  }

  // Reset failed attempts and update last login
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    })
    .where(eq(users.id, user.id));

  return { success: true, user };
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
```

#### `app/utils/session.server.ts`
```typescript
import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { generateSessionToken } from "./auth.server";

const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds
const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret-change-in-production";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "admin_session",
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createUserSession(userId: number, redirectTo: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // Create session in database
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  const session = await sessionStorage.getSession();
  session.set("token", token);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  
  const token = session.get("token");
  if (!token) return null;

  // Find valid session
  const dbSession = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, token),
      gt(sessions.expiresAt, new Date())
    ),
    with: {
      user: true,
    },
  });

  return dbSession;
}

export async function requireUserSession(request: Request) {
  const session = await getUserSession(request);
  
  if (!session || !session.user.isActive) {
    throw redirect("/admin/login");
  }
  
  return session;
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  
  const token = session.get("token");
  if (token) {
    // Delete session from database
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
```

### 4. Create Login Route

#### `app/routes/admin/login.tsx`
```typescript
import { useActionData, Form, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticateUser } from "../../utils/auth.server";
import { createUserSession, getUserSession } from "../../utils/session.server";
import { redirect } from "react-router";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getUserSession(request);
  if (session) {
    return redirect("/admin");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const { email: validEmail, password: validPassword } = loginSchema.parse({
      email,
      password,
    });

    const result = await authenticateUser(validEmail, validPassword);

    if (!result.success) {
      return { error: result.error };
    }

    return createUserSession(result.user!.id, "/admin");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "An unexpected error occurred" };
  }
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Admin Login
          </h2>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {actionData.error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
```

### 5. Create Logout Route

#### `app/routes/admin/logout.tsx`
```typescript
import type { ActionFunctionArgs } from "react-router";
import { logout } from "../../utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request);
}
```

### 6. Update Protected Routes

#### Update `app/routes/admin/index.tsx`
```typescript
import type { LoaderFunctionArgs } from "react-router";
import { requireUserSession } from "../../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireUserSession(request);
  
  // Load statistics for dashboard
  const stats = await getOrderStats();
  
  return {
    stats,
    user: session.user,
  };
}
```

#### Update `app/routes/admin/orders.tsx`
```typescript
import type { LoaderFunctionArgs } from "react-router";
import { requireUserSession } from "../../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireUserSession(request);
  
  // Your existing loader logic
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  // ... rest of loader
}
```

### 7. Add Logout Button to Admin Layout

In your admin pages, add a logout button:

```tsx
<form action="/admin/logout" method="post">
  <button
    type="submit"
    className="text-sm text-gray-500 hover:text-gray-700"
  >
    Logout
  </button>
</form>
```

### 8. Create Admin User Seed Script

#### `scripts/seed-admin.ts`
```typescript
import { db } from "../app/db";
import { users } from "../app/db/schema";
import { hashPassword } from "../app/utils/auth.server";

async function seedAdmin() {
  const email = "admin@pandidorty.cz";
  const password = "admin123"; // CHANGE THIS!
  
  const hashedPassword = await hashPassword(password);
  
  try {
    await db.insert(users).values({
      email,
      name: "Admin User",
      password: hashedPassword,
      isActive: true,
    });
    
    console.log(`Admin user created: ${email}`);
    console.log("Password: admin123 (PLEASE CHANGE THIS!)");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
  
  process.exit(0);
}

seedAdmin();
```

Run with: `npx tsx scripts/seed-admin.ts`

## Environment Variables

Add to `.env`:
```
SESSION_SECRET=your-very-secure-random-string-here
DATABASE_URL=your-database-url
```

## Testing the Implementation

1. Apply the database migration
2. Seed the admin user
3. Start the development server
4. Navigate to `/admin`
5. You should be redirected to `/admin/login`
6. Login with the seeded credentials
7. You should be redirected to `/admin` dashboard
8. Test logout functionality

## Security Checklist

- [ ] Change default admin password
- [ ] Set secure SESSION_SECRET in production
- [ ] Enable HTTPS in production
- [ ] Test account lockout after failed attempts
- [ ] Implement session cleanup (delete expired sessions)
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add logging for security events

## Next Steps

1. **Password Reset**: Implement password reset functionality
2. **User Management**: Create UI for managing admin users
3. **Session Management**: Add "Remember me" functionality
4. **Security Enhancements**: Add 2FA support
5. **Audit Logging**: Log all admin actions 