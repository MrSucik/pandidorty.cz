import { addDays, format } from "date-fns";
import { cs } from "date-fns/locale";
import { count, eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { db, orders } from "../db";

// Maximum capacity for MDZ orders
const MAX_MDZ_CAPACITY = 23;

// Check if email is configured (but don't crash if not)
const isEmailConfigured = !!process.env.RESEND_API_KEY;

// Function to get current MDZ order count
async function getCurrentMdzCount(): Promise<number> {
	const result = await db
		.select({ value: count() })
		.from(orders)
		.where(eq(orders.orderKind, "mdz"));
	return result[0]?.value ?? 0;
}

// Export function to get remaining capacity
export async function getMdzCapacity(): Promise<{
	current: number;
	max: number;
	remaining: number;
	isAvailable: boolean;
}> {
	const current = await getCurrentMdzCount();
	const remaining = Math.max(0, MAX_MDZ_CAPACITY - current);
	return {
		current,
		max: MAX_MDZ_CAPACITY,
		remaining,
		isAvailable: remaining > 0,
	};
}

// Zod schema for MDZ order validation
const mdzSchema = z
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
				"Vyberte alespoň jednu krabičku (dorty nebo zákusky)",
		},
	);

export interface SubmitMdzResult {
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
	return `MDZ-${timestamp}-${random}`;
}

// Main function to be called from the API route
export async function submitMdz(
	formData: FormData,
): Promise<SubmitMdzResult> {
	// Extract form fields
	const orderData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: formData.get("phone") as string,
		cakeBox: formData.get("cakeBox") === "true",
		sweetbarBox: formData.get("sweetbarBox") === "true",
	};

	// Validate with Zod
	const validationResult = mdzSchema.safeParse(orderData);

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues.map(
			(err) => err.message,
		);
		throw new Error(errorMessages.join(", "));
	}

	const validated = validationResult.data;

	try {
		// Use transaction to ensure atomic capacity check and insert
		const newOrder = await db.transaction(async (tx) => {
			// Lock existing mdz rows to prevent race conditions
			// Note: FOR UPDATE cannot be used with aggregate functions, so we lock rows first, then count
			await tx
				.select({ id: orders.id })
				.from(orders)
				.where(eq(orders.orderKind, "mdz"))
				.for("update");

			// Now count the locked rows
			const [{ currentCount }] = await tx
				.select({ currentCount: count() })
				.from(orders)
				.where(eq(orders.orderKind, "mdz"));

			// Check capacity within the transaction
			if (currentCount >= MAX_MDZ_CAPACITY) {
				throw new Error(
					`Omlouváme se, ale kapacita pro objednávky ke Dni žen je již naplněna (${MAX_MDZ_CAPACITY} objednávek). Zkuste to prosím později nebo nás kontaktujte přímo.`,
				);
			}

			const orderNumber = generateOrderNumber();

			// Save order to database
			// Note: We set a default delivery date (7 days from now) since it's not collected in the form
			const defaultDeliveryDate = addDays(new Date(), 7);

			const [inserted] = await tx
				.insert(orders)
				.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate: defaultDeliveryDate,
				orderKind: "mdz",
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

			return inserted;
		});

		// Send notification emails
		try {
			const resend = new Resend(process.env.RESEND_API_KEY);

			// Prepare order details
			let orderDetails = "Objednané položky:\n";

			if (validated.cakeBox) {
				orderDetails += "\n- Krabička dortů";
			}

			if (validated.sweetbarBox) {
				orderDetails += "\n- Krabička zákusků";
			}

			// Send notification emails if configured
			if (isEmailConfigured) {
				// Send admin notification email
				await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: ["mr.sucik@gmail.com", "pandidorty@gmail.com"],
				subject: `Nová objednávka MDŽ #${newOrder.orderNumber} - ${validated.name}`,
				text: `
Nová objednávka ke Dni žen!

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
				subject: `Potvrzení objednávky ke Dni žen #${newOrder.orderNumber}`,
				text: `
Dobrý den ${validated.name},

děkujeme za Vaši objednávku ke Dni žen! Tímto potvrzujeme, že jsme Vaši objednávku přijali a brzy se Vám ozveme s dalšími informacemi.

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
				console.warn("Email not configured - skipping notification emails");
			}
		} catch (emailError) {
			console.error("Error sending emails:", emailError);
			// Don't throw here - the order was saved successfully
		}

		// Return success response with real order data
		return {
			success: true,
			message:
				"Děkujeme! Vaše objednávka ke Dni žen byla úspěšně odeslána.",
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
		console.error("Error processing MDZ order:", error);

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
