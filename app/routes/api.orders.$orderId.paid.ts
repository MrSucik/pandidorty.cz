import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { db, orders } from "../db";

export async function action({ request, params }: ActionFunctionArgs) {
	if (request.method !== "PATCH") {
		return new Response("Method not allowed", { status: 405 });
	}

	const orderId = params.orderId;
	if (!orderId || Number.isNaN(Number(orderId))) {
		return new Response(JSON.stringify({ error: "Invalid order ID" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const body = await request.json();
		const { isPaid } = body;

		if (typeof isPaid !== "boolean") {
			return new Response(
				JSON.stringify({ error: "isPaid must be a boolean" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Update the order
		const [updatedOrder] = await db
			.update(orders)
			.set({
				paidAt: isPaid ? new Date() : null,
				updatedAt: new Date(),
			})
			.where(eq(orders.id, Number(orderId)))
			.returning();

		if (!updatedOrder) {
			return new Response(JSON.stringify({ error: "Order not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				paidAt: updatedOrder.paidAt?.toISOString() || null,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error updating order paid status:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
