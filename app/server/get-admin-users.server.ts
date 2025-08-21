import { desc } from "drizzle-orm";
import { db, users } from "../db";

export interface AdminUser {
	id: number;
	email: string;
	name: string;
	isActive: boolean;
	lastLogin: Date | null;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
	const result = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			isActive: users.isActive,
			lastLogin: users.lastLogin,
			failedLoginAttempts: users.failedLoginAttempts,
			lockedUntil: users.lockedUntil,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.orderBy(desc(users.createdAt));

	return result;
}
