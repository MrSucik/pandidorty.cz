import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { removeBlockedDate } from "../server/blocked-dates.server";
import { requireApiSession } from "../utils/session.server";

const removeBlockedDateSchema = z.object({
	id: z
		.string()
		.min(1, "ID is required")
		.transform((val) => {
			const num = Number.parseInt(val, 10);
			if (Number.isNaN(num)) {
				throw new Error("ID must be a valid number");
			}
			return num;
		}),
});

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "DELETE") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	try {
		await requireApiSession(request);
		const body = await request.json();

		const validation = removeBlockedDateSchema.safeParse(body);
		if (!validation.success) {
			return Response.json(
				{
					error: "Invalid request data",
					details: validation.error.issues,
				},
				{ status: 400 },
			);
		}

		const { id } = validation.data;
		await removeBlockedDate(id);

		return { success: true };
	} catch (error) {
		// If it's already a Response (from requireApiSession), re-throw it
		if (error instanceof Response) {
			throw error;
		}
		if (error instanceof Error) {
			return Response.json({ error: error.message }, { status: 400 });
		}
		return Response.json(
			{ error: "Failed to remove blocked date" },
			{ status: 500 },
		);
	}
}
