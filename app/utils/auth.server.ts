import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

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
	hash: string,
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
		const updates: { failedLoginAttempts: number; lockedUntil?: Date | null } =
			{
				failedLoginAttempts: attempts,
			};

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
