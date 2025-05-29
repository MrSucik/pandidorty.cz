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