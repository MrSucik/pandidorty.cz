import type { ActionFunctionArgs } from "react-router";
import { submitOrder } from "../server/submit-order.server";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const formData = await request.formData();
		const result = await submitOrder(formData);

		return result;
	} catch (error) {
		console.error("Error in submit-order API route:", error);
		return Response.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 400 },
		);
	}
}
