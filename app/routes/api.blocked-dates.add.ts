import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { addBlockedDate } from "../server/blocked-dates.server";
import { requireApiSession } from "../utils/session.server";

const addBlockedDateSchema = z.union([
	// Single date format
	z.object({
		date: z.string().min(1, "Date is required"),
	}),
	// Date range format
	z.object({
		startDate: z.string().min(1, "Start date is required"),
		endDate: z.string().min(1, "End date is required"),
	}),
]);

// Helper function to generate dates between start and end (inclusive)
function getDatesBetween(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (start > end) {
		throw new Error("Start date must be before or equal to end date");
	}

	const current = new Date(start);
	while (current <= end) {
		const year = current.getFullYear();
		const month = String(current.getMonth() + 1).padStart(2, "0");
		const day = String(current.getDate()).padStart(2, "0");
		dates.push(`${year}-${month}-${day}`);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	try {
		const session = await requireApiSession(request);
		const body = await request.json();

		const validation = addBlockedDateSchema.safeParse(body);
		if (!validation.success) {
			return Response.json(
				{
					error: "Invalid request data",
					details: validation.error.issues,
				},
				{ status: 400 },
			);
		}

		const data = validation.data;
		let datesToBlock: string[] = [];

		if ("date" in data) {
			// Single date
			datesToBlock = [data.date];
		} else {
			// Date range
			try {
				datesToBlock = getDatesBetween(data.startDate, data.endDate);
			} catch (error) {
				return Response.json(
					{
						error:
							error instanceof Error ? error.message : "Invalid date range",
					},
					{ status: 400 },
				);
			}
		}

		// Add each date in the range
		for (const date of datesToBlock) {
			await addBlockedDate(date, session.user.id);
		}

		return {
			success: true,
			blockedDatesCount: datesToBlock.length,
		};
	} catch (error) {
		// If it's already a Response (from requireApiSession), re-throw it
		if (error instanceof Response) {
			throw error;
		}
		if (error instanceof Error) {
			return Response.json({ error: error.message }, { status: 400 });
		}
		return Response.json(
			{ error: "Failed to add blocked date" },
			{ status: 500 },
		);
	}
}
