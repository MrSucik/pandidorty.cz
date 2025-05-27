// Dynamic imports to ensure server-only execution
import { createServerFn } from '@tanstack/react-start'

export interface OrderStats {
  pending: number
  processing: number
  delivered: number
  total: number
}

export async function getOrderStats(): Promise<OrderStats> {
  const { db, orders } = await import('../db')
  const { eq, count } = await import('drizzle-orm')
  
  // 4 parallel COUNT(*) queries – minimal traffic
  const [p, pr, d, t] = await Promise.all([
    db.select({ c: count() }).from(orders).where(eq(orders.status, 'pending')),
    db.select({ c: count() }).from(orders).where(eq(orders.status, 'processing')),
    db.select({ c: count() }).from(orders).where(eq(orders.status, 'delivered')),
    db.select({ c: count() }).from(orders)
  ])

  return {
    pending: p[0]?.c ?? 0,
    processing: pr[0]?.c ?? 0,
    delivered: d[0]?.c ?? 0,
    total: t[0]?.c ?? 0
  }
}

// TanStack Start server function
export const getOrderStatsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await getOrderStats()
}) 