import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
	const { photoId } = params as { photoId?: string };
	if (!photoId) {
		throw new Response("Photo ID required", { status: 400 });
	}

	const id = Number.parseInt(photoId, 10);
	if (Number.isNaN(id)) {
		throw new Response("Invalid photo ID", { status: 400 });
	}

	// Lazy import to keep DB code server-only
	const { db, orderPhotos } = await import("../db");
	const { eq } = await import("drizzle-orm");

	const rows = await db
		.select()
		.from(orderPhotos)
		.where(eq(orderPhotos.id, id))
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
			"Cache-Control": "public, max-age=31536000",
			"Content-Disposition": `inline; filename="${photo.originalName}"`,
		},
	});
}

// Tell React Router that this route returns raw binary so no serialization
export const unstable_shouldSerializeLoaderData = () => false;
