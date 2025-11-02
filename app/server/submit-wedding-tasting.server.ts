import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { count, eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { WEDDING_TASTING_DATA } from "../data/wedding-tasting";
import { db, orders } from "../db";

// Maximum capacity for wedding tasting orders
const MAX_WEDDING_TASTING_CAPACITY = 15;

// Check if email is configured (but don't crash if not)
const isEmailConfigured = !!process.env.RESEND_API_KEY;

// Function to get current wedding tasting order count
async function getCurrentWeddingTastingCount(): Promise<number> {
	const result = await db
		.select({ value: count() })
		.from(orders)
		.where(eq(orders.orderKind, "wedding_tasting"));
	return result[0]?.value ?? 0;
}

// Export function to get remaining capacity
export async function getWeddingTastingCapacity(): Promise<{
	current: number;
	max: number;
	remaining: number;
	isAvailable: boolean;
}> {
	const current = await getCurrentWeddingTastingCount();
	const remaining = Math.max(0, MAX_WEDDING_TASTING_CAPACITY - current);
	return {
		current,
		max: MAX_WEDDING_TASTING_CAPACITY,
		remaining,
		isAvailable: remaining > 0,
	};
}

// Zod schema for wedding tasting order validation
const weddingTastingSchema = z
	.object({
		name: z
			.string()
			.min(1, "Jméno je povinné")
			.min(2, "Jméno musí mít alespoň 2 znaky"),
		email: z.string().min(1, "Email je povinný").email("Neplatný email"),
		phone: z
			.string()
			.min(1, "Telefon je povinný")
			.min(9, "Telefon musí mít alespoň 9 číslic")
			.regex(/^[0-9+\s()-]+$/, "Zadejte platné telefonní číslo"),
		cakeBox: z.boolean(),
		sweetbarBox: z.boolean(),
	})
	.refine(
		(data) => {
			// At least one box type must be selected
			return data.cakeBox || data.sweetbarBox;
		},
		{
			message:
				"Vyberte alespoň jednu ochutnávkovou krabičku (dort nebo sweetbar)",
		},
	);

export interface SubmitWeddingTastingResult {
	success: boolean;
	message: string;
	orderId: string;
	orderDetails: {
		id: number;
		orderNumber: string;
		customerName: string;
		cakeBox: boolean;
		sweetbarBox: boolean;
	};
}

// Generate a unique order number
function generateOrderNumber(): string {
	const timestamp = Date.now();
	const random = Math.floor(Math.random() * 1000)
		.toString()
		.padStart(3, "0");
	return `WEDDING-${timestamp}-${random}`;
}

// Main function to be called from the API route
export async function submitWeddingTasting(
	formData: FormData,
): Promise<SubmitWeddingTastingResult> {
	// Extract form fields
	const orderData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: formData.get("phone") as string,
		cakeBox: formData.get("cakeBox") === "true",
		sweetbarBox: formData.get("sweetbarBox") === "true",
	};

	// Validate with Zod
	const validationResult = weddingTastingSchema.safeParse(orderData);

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues.map(
			(err) => err.message,
		);
		throw new Error(errorMessages.join(", "));
	}

	const validated = validationResult.data;

	try {
		// Simple capacity check (no transaction needed for low volume)
		const currentCount = await getCurrentWeddingTastingCount();
		if (currentCount >= MAX_WEDDING_TASTING_CAPACITY) {
			throw new Error(
				`Omlouváme se, ale kapacita pro svatební ochutnávky je již naplněna (${MAX_WEDDING_TASTING_CAPACITY} objednávek). Zkuste to prosím později nebo nás kontaktujte přímo.`,
			);
		}

		const orderNumber = generateOrderNumber();

		// Save order to database
		// Use the fixed pickup date from config
		const deliveryDate = WEDDING_TASTING_DATA.pickup.pickupDate;

		const [newOrder] = await db
			.insert(orders)
			.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate,
				orderKind: "wedding_tasting",
				orderCake: validated.cakeBox,
				orderDessert: validated.sweetbarBox,
				cakeSize: validated.cakeBox ? "tasting" : null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: validated.sweetbarBox ? "tasting" : null,
				tastingCakeBoxQty: validated.cakeBox ? 1 : null,
				tastingSweetbarBoxQty: validated.sweetbarBox ? 1 : null,
				tastingNotes: null,
				shippingAddress: null,
				billingAddress: null,
				totalAmount: null,
				notes: null,
				createdById: null,
				updatedById: null,
			})
			.returning();

		// Send notification emails
		try {
			const resend = new Resend(process.env.RESEND_API_KEY);

			// Prepare order details
			let orderDetails = "Objednané položky:\n";

			if (validated.cakeBox) {
				orderDetails += "\n- ☑ Ochutnávková krabička dortů";
			}

			if (validated.sweetbarBox) {
				orderDetails += "\n- ☑ Ochutnávková krabička sweetbar";
			}

			// Send notification emails if configured
			if (isEmailConfigured) {
				// Send admin notification email
				await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: ["mr.sucik@gmail.com", "pandidorty@gmail.com"],
				subject: `💍 Nová svatební ochutnávka #${newOrder.orderNumber} - ${validated.name}`,
				text: `
Nová objednávka svatební ochutnávky!

Číslo objednávky: ${newOrder.orderNumber}
Datum přijetí: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: cs })}

KONTAKTNÍ ÚDAJE:
Jméno: ${validated.name}
Email: ${validated.email}
Telefon: ${validated.phone}

${orderDetails}
`,
			});

			// Send customer confirmation email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: validated.email,
				subject: `💍 Potvrzení objednávky svatební ochutnávky #${newOrder.orderNumber}`,
				text: `
Dobrý den ${validated.name},

děkujeme za Váš zájem o svatební ochutnávku! Tímto potvrzujeme, že jsme Vaši objednávku přijali a brzy se Vám ozveme s dalšími detaily.

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${newOrder.orderNumber}

${orderDetails}

Ozveme se Vám co nejdříve ohledně termínu a dalších podrobností.

Pokud budete mít jakékoliv dotazy, neváhejte nás kontaktovat na pandidorty@gmail.com.

S pozdravem,
Tým Pandí Dorty
`,
				});
			} else {
				console.warn("⚠️ Email not configured - skipping notification emails");
			}
		} catch (emailError) {
			console.error("⚠️ Error sending emails:", emailError);
			// Don't throw here - the order was saved successfully
		}

		// Return success response with real order data
		return {
			success: true,
			message:
				"Děkujeme! Vaše objednávka svatební ochutnávky byla úspěšně odeslána.",
			orderId: newOrder.orderNumber,
			orderDetails: {
				id: newOrder.id,
				orderNumber: newOrder.orderNumber,
				customerName: newOrder.customerName,
				cakeBox: validated.cakeBox,
				sweetbarBox: validated.sweetbarBox,
			},
		};
	} catch (error) {
		console.error("💥 Error processing wedding tasting order:", error);

		// Preserve specific error messages (like capacity full)
		if (error instanceof Error) {
			throw error;
		}

		// Generic fallback for unexpected errors
		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
