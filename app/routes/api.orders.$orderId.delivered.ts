import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { db, orders } from "../db";
import { requireApiSession } from "../utils/session.server";

const paramsSchema = z.object({
	orderId: z.string().transform((val) => {
		const num = Number(val);
		if (Number.isNaN(num)) {
			throw new Error("Order ID must be a valid number");
		}
		return num;
	}),
});

const bodySchema = z.object({
	isDelivered: z.boolean(),
});

export async function action({ request, params }: ActionFunctionArgs) {
	if (request.method !== "PATCH") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const session = await requireApiSession(request);

		// Validate params
		const paramsValidation = paramsSchema.safeParse(params);
		if (!paramsValidation.success) {
			return new Response(
				JSON.stringify({
					error: "Invalid order ID",
					details: paramsValidation.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate body
		const body = await request.json();
		const bodyValidation = bodySchema.safeParse(body);
		if (!bodyValidation.success) {
			return new Response(
				JSON.stringify({
					error: "Invalid request data",
					details: bodyValidation.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const { orderId } = paramsValidation.data;
		const { isDelivered } = bodyValidation.data;

		// Update the order
		const [updatedOrder] = await db
			.update(orders)
			.set({
				deliveredAt: isDelivered ? new Date() : null,
				updatedAt: new Date(),
				updatedById: session.user.id, // Track who made the update
			})
			.where(eq(orders.id, orderId))
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
		// If it's already a Response (from requireApiSession), re-throw it
		if (error instanceof Response) {
			throw error;
		}
		console.error("Error updating order delivered status:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
