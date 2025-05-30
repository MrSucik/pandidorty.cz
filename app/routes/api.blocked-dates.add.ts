import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { addBlockedDate } from "../server/blocked-dates.server";
import { requireApiSession } from "../utils/session.server";

const addBlockedDateSchema = z.object({
	date: z.string().min(1, "Date is required"),
});

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const session = await requireApiSession(request);
		const body = await request.json();

		const validation = addBlockedDateSchema.safeParse(body);
		if (!validation.success) {
			return new Response(
				JSON.stringify({
					error: "Invalid request data",
					details: validation.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const { date } = validation.data;
		await addBlockedDate(date, session.user.id);

		return { success: true };
	} catch (error) {
		// If it's already a Response (from requireApiSession), re-throw it
		if (error instanceof Response) {
			throw error;
		}
		if (error instanceof Error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(
			JSON.stringify({ error: "Failed to add blocked date" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
