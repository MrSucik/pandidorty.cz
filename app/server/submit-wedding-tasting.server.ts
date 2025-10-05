import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { Resend } from "resend";
import { z } from "zod";
import { db, orders } from "../db";

// Verify RESEND_API_KEY is set at module load time
if (!process.env.RESEND_API_KEY) {
	throw new Error(
		"RESEND_API_KEY environment variable is not set. Email functionality will not work.",
	);
}

// Helper function for date validation (at least 3 days from now)
const _isValidPickupDate = (dateString: string): boolean => {
	try {
		const selectedDate = parseISO(dateString);
		const minDate = addDays(startOfDay(new Date()), 3);
		return (
			isAfter(selectedDate, minDate) ||
			selectedDate.getTime() === minDate.getTime()
		);
	} catch {
		return false;
	}
};

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
			.min(9, "Telefon musí mít alespoň 9 číslic"),
		cakeBox: z.boolean(),
		sweetbarBox: z.boolean(),
		quantity: z.coerce.number().int().min(1, "Množství musí být alespoň 1"),
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
		quantity: number;
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
		quantity: formData.get("quantity"),
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
		const orderNumber = generateOrderNumber();

		// Save order to database
		// Note: We set a default delivery date (7 days from now) since it's not collected in the form
		const defaultDeliveryDate = addDays(new Date(), 7);

		const [newOrder] = await db
			.insert(orders)
			.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate: defaultDeliveryDate,
				orderKind: "wedding_tasting",
				orderCake: validated.cakeBox,
				orderDessert: validated.sweetbarBox,
				cakeSize: validated.cakeBox ? `${validated.quantity}` : null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: validated.sweetbarBox ? `${validated.quantity}` : null,
				tastingCakeBoxQty: validated.cakeBox ? validated.quantity : null,
				tastingSweetbarBoxQty: validated.sweetbarBox
					? validated.quantity
					: null,
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
				orderDetails += `\n- ☑ Ochutnávková krabička dortů (množství: ${validated.quantity})`;
			}

			if (validated.sweetbarBox) {
				orderDetails += `\n- ☑ Ochutnávková krabička sweetbar (množství: ${validated.quantity})`;
			}

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
				quantity: validated.quantity,
			},
		};
	} catch (error) {
		console.error("💥 Error processing wedding tasting order:", error);
		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
