// Dynamic imports to ensure server-only execution

import { count, eq } from "drizzle-orm";
import { db, orders } from "../db";

export interface OrderStats {
	created: number;
	paid: number;
	delivered: number;
	total: number;
}

export async function getOrderStats(): Promise<OrderStats> {
	// 4 parallel COUNT(*) queries – minimal traffic
	const [c, p, d, t] = await Promise.all([
		db.select({ c: count() }).from(orders).where(eq(orders.status, "created")),
		db.select({ c: count() }).from(orders).where(eq(orders.status, "paid")),
		db
			.select({ c: count() })
			.from(orders)
			.where(eq(orders.status, "delivered")),
		db.select({ c: count() }).from(orders),
	]);

	return {
		created: c[0]?.c ?? 0,
		paid: p[0]?.c ?? 0,
		delivered: d[0]?.c ?? 0,
		total: t[0]?.c ?? 0,
	};
}
