import type { LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { requireApiSession } from "../utils/session.server";

const paramsSchema = z.object({
	photoId: z.string().transform((val) => {
		const num = Number.parseInt(val, 10);
		if (Number.isNaN(num)) {
			throw new Error("Photo ID must be a valid number");
		}
		return num;
	}),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
	// Check authentication - photos contain customer order data
	await requireApiSession(request);

	// Validate params
	const paramsValidation = paramsSchema.safeParse(params);
	if (!paramsValidation.success) {
		throw new Response(
			JSON.stringify({
				error: "Invalid photo ID",
				details: paramsValidation.error.issues,
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const { photoId } = paramsValidation.data;

	// Lazy import to keep DB code server-only
	const { db, orderPhotos } = await import("../db");
	const { eq } = await import("drizzle-orm");

	const rows = await db
		.select()
		.from(orderPhotos)
		.where(eq(orderPhotos.id, photoId))
		.limit(1);

	if (!rows[0]) {
		throw new Response("Photo not found", { status: 404 });
	}

	const photo = rows[0] as {
		imageData: string;
		mimeType: string;
		fileSize: number;
		originalName: string;
	};
	const buffer = Buffer.from(photo.imageData, "base64");

	return new Response(buffer, {
		headers: {
			"Content-Type": photo.mimeType,
			"Content-Length": photo.fileSize.toString(),
			"Cache-Control": "private, max-age=3600",
			"Content-Disposition": `inline; filename="${photo.originalName}"`,
		},
	});
}

// Tell React Router that this route returns raw binary so no serialization
export const unstable_shouldSerializeLoaderData = () => false;
