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
	isPaid: z.boolean(),
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
			return Response.json(
				{
					error: "Invalid order ID",
					details: paramsValidation.error.issues,
				},
				{ status: 400 },
			);
		}

		// Validate body
		const body = await request.json();
		const bodyValidation = bodySchema.safeParse(body);
		if (!bodyValidation.success) {
			return Response.json(
				{
					error: "Invalid request data",
					details: bodyValidation.error.issues,
				},
				{ status: 400 },
			);
		}

		const { orderId } = paramsValidation.data;
		const { isPaid } = bodyValidation.data;

		// Update the order
		const [updatedOrder] = await db
			.update(orders)
			.set({
				paidAt: isPaid ? new Date() : null,
				updatedAt: new Date(),
				updatedById: session.user.id, // Track who made the update
			})
			.where(eq(orders.id, orderId))
			.returning();

		if (!updatedOrder) {
			return Response.json({ error: "Order not found" }, { status: 404 });
		}

		return {
			success: true,
			paidAt: updatedOrder.paidAt?.toISOString() || null,
		};
	} catch (error) {
		// If it's already a Response (from requireApiSession), re-throw it
		if (error instanceof Response) {
			throw error;
		}
		console.error("Error updating order paid status:", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
}
