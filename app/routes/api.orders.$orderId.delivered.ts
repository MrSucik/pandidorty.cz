import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { db, orders } from "../db";
import { getUserSession } from "../utils/session.server";

export async function action({ request, params }: ActionFunctionArgs) {
	// Check authentication
	const session = await getUserSession(request);
	if (!session || !session.user.isActive) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

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
		const { isDelivered } = body;

		if (typeof isDelivered !== "boolean") {
			return new Response(
				JSON.stringify({ error: "isDelivered must be a boolean" }),
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
				deliveredAt: isDelivered ? new Date() : null,
				updatedAt: new Date(),
				updatedById: session.user.id, // Track who made the update
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
				deliveredAt: updatedOrder.deliveredAt?.toISOString() || null,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error updating order delivered status:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
