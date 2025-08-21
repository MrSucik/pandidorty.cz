// Dynamic imports to ensure server-only execution

import { count, isNotNull } from "drizzle-orm";
import { db, orders } from "../db";

export interface OrderStats {
	paid: number;
	delivered: number;
	total: number;
}

export async function getOrderStats(): Promise<OrderStats> {
	// 3 parallel COUNT(*) queries – minimal traffic
	const [p, d, t] = await Promise.all([
		db.select({ c: count() }).from(orders).where(isNotNull(orders.paidAt)),
		db.select({ c: count() }).from(orders).where(isNotNull(orders.deliveredAt)),
		db.select({ c: count() }).from(orders),
	]);

	return {
		paid: p[0]?.c ?? 0,
		delivered: d[0]?.c ?? 0,
		total: t[0]?.c ?? 0,
	};
}
