import { desc, eq } from "drizzle-orm";
import { blockedDates, db, users } from "../db";
import type { BlockedDate } from "../db/schema";

export interface BlockedDateWithUser extends BlockedDate {
	createdBy: {
		id: number;
		name: string;
		email: string;
	};
}

export async function getBlockedDates(): Promise<BlockedDateWithUser[]> {
	const result = await db
		.select({
			id: blockedDates.id,
			date: blockedDates.date,
			createdById: blockedDates.createdById,
			createdAt: blockedDates.createdAt,
			createdBy: {
				id: users.id,
				name: users.name,
				email: users.email,
			},
		})
		.from(blockedDates)
		.innerJoin(users, eq(blockedDates.createdById, users.id))
		.orderBy(desc(blockedDates.date));

	return result;
}

export async function addBlockedDate(
	date: string,
	userId: number,
): Promise<void> {
	await db.insert(blockedDates).values({
		date,
		createdById: userId,
	});
}

export async function removeBlockedDate(id: number): Promise<void> {
	await db.delete(blockedDates).where(eq(blockedDates.id, id));
}

export async function isDateBlocked(date: string): Promise<boolean> {
	const result = await db
		.select({ id: blockedDates.id })
		.from(blockedDates)
		.where(eq(blockedDates.date, date))
		.limit(1);

	return result.length > 0;
}
