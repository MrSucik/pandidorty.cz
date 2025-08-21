import { eq } from "drizzle-orm";
import { db, type NewOrderPhoto, type OrderPhoto, orderPhotos } from "./index";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
];

// Save photo file and create database record
export async function saveOrderPhoto(
	orderId: number,
	file: File,
): Promise<
	{ success: true; photo: OrderPhoto } | { success: false; error: string }
> {
	try {
		// Validate file
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: "File size too large (max 10MB)" };
		}

		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return {
				success: false,
				error: "Invalid file type. Only images are allowed.",
			};
		}

		// Convert file to base64
		const buffer = Buffer.from(await file.arrayBuffer());
		const base64Data = buffer.toString("base64");

		// Save to database
		const photoData: Omit<NewOrderPhoto, "id" | "uploadedAt"> = {
			orderId,
			originalName: file.name,
			mimeType: file.type,
			fileSize: file.size,
			imageData: base64Data,
		};

		const [newPhoto] = await db
			.insert(orderPhotos)
			.values(photoData)
			.returning();

		return { success: true, photo: newPhoto };
	} catch (error) {
		console.error("Error saving photo:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

// Save multiple photos for an order
export async function saveOrderPhotos(
	orderId: number,
	files: File[],
): Promise<
	{ success: true; photos: OrderPhoto[] } | { success: false; error: string }
> {
	try {
		const savedPhotos: OrderPhoto[] = [];
		const errors: string[] = [];

		for (const file of files) {
			if (file.size === 0) continue; // Skip empty files

			const result = await saveOrderPhoto(orderId, file);
			if (result.success) {
				savedPhotos.push(result.photo);
			} else {
				errors.push(`${file.name}: ${result.error}`);
			}
		}

		if (errors.length > 0 && savedPhotos.length === 0) {
			return { success: false, error: errors.join(", ") };
		}

		return { success: true, photos: savedPhotos };
	} catch (error) {
		console.error("Error saving photos:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
