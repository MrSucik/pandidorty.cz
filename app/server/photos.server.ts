import { eq } from "drizzle-orm";
import { db, orderPhotos } from "../db";

export async function getPhoto(photoId: number): Promise<Response> {
	try {
		// Get photo from database
		const photo = await db
			.select()
			.from(orderPhotos)
			.where(eq(orderPhotos.id, photoId))
			.limit(1);

		if (!photo[0]) {
			return new Response("Photo not found", { status: 404 });
		}

		const photoData = photo[0] as {
			imageData: string;
			mimeType: string;
			fileSize: number;
			originalName: string;
		};

		// Convert base64 back to binary
		const buffer = Buffer.from(photoData.imageData, "base64");

		// Return the image with proper headers
		return new Response(buffer, {
			headers: {
				"Content-Type": photoData.mimeType,
				"Content-Length": photoData.fileSize.toString(),
				"Cache-Control": "public, max-age=31536000", // Cache for 1 year
				"Content-Disposition": `inline; filename=\"${photoData.originalName}\"`,
			},
		});
	} catch (error) {
		console.error("Error serving photo:", error);
		return new Response("Internal server error", { status: 500 });
	}
}
