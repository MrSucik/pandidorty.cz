import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { Resend } from "resend";
import { z } from "zod";
import { db, orders } from "../db";
import { isDateBlocked } from "./blocked-dates.server";

// Verify RESEND_API_KEY is set at module load time
if (!process.env.RESEND_API_KEY) {
	throw new Error(
		"RESEND_API_KEY environment variable is not set. Email functionality will not work.",
	);
}

// Helper function for date validation (at least 3 days from now)
const isValidPickupDate = (dateString: string): boolean => {
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

// Hardcoded prices (to be updated later)
const CAKE_BOX_PRICE = 450; // CZK
const SWEETBAR_BOX_PRICE = 350; // CZK

// Zod schema for Christmas tasting order validation
const christmasOrderSchema = z
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
		date: z
			.string()
			.min(1, "Datum vyzvednutí je povinné")
			.refine(
				isValidPickupDate,
				"Datum vyzvednutí musí být alespoň 3 dny od dnes",
			),
		cakeBoxQty: z.coerce.number().int().min(0).default(0),
		sweetbarBoxQty: z.coerce.number().int().min(0).default(0),
	})
	.refine(
		(data) => {
			// At least one box type must have quantity > 0
			return data.cakeBoxQty > 0 || data.sweetbarBoxQty > 0;
		},
		{
			message:
				"Vyberte alespoň jednu ochutnávkovou krabičku (dort nebo sweetbar)",
		},
	);

export interface SubmitChristmasOrderResult {
	success: boolean;
	message: string;
	orderId: string;
	orderDetails: {
		id: number;
		orderNumber: string;
		customerName: string;
		deliveryDate: Date;
		cakeBoxQty: number;
		sweetbarBoxQty: number;
		totalAmount: number;
	};
}

// Generate a unique order number
function generateOrderNumber(): string {
	const timestamp = Date.now();
	const random = Math.floor(Math.random() * 1000)
		.toString()
		.padStart(3, "0");
	return `XMAS-${timestamp}-${random}`;
}

// Main function to be called from the API route
export async function submitChristmasOrder(
	formData: FormData,
): Promise<SubmitChristmasOrderResult> {
	// Extract form fields
	const orderData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: formData.get("phone") as string,
		date: formData.get("date") as string,
		cakeBoxQty: formData.get("cakeBoxQty"),
		sweetbarBoxQty: formData.get("sweetbarBoxQty"),
	};

	// Validate with Zod
	const validationResult = christmasOrderSchema.safeParse(orderData);

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues.map(
			(err) => err.message,
		);
		throw new Error(errorMessages.join(", "));
	}

	const validated = validationResult.data;

	// Check if the selected date is blocked
	const dateIsBlocked = await isDateBlocked(validated.date);
	if (dateIsBlocked) {
		throw new Error("Vybraný termín není dostupný. Zvolte prosím jiný termín.");
	}

	try {
		const orderNumber = generateOrderNumber();

		// Calculate total amount
		const totalAmount =
			validated.cakeBoxQty * CAKE_BOX_PRICE +
			validated.sweetbarBoxQty * SWEETBAR_BOX_PRICE;

		// Save order to database
		const [newOrder] = await db
			.insert(orders)
			.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate: new Date(validated.date),
				orderKind: "christmas_tasting",
				orderCake: false,
				orderDessert: false,
				cakeSize: null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: null,
				tastingCakeBoxQty: validated.cakeBoxQty,
				tastingSweetbarBoxQty: validated.sweetbarBoxQty,
				tastingNotes: null,
				shippingAddress: null,
				billingAddress: null,
				totalAmount: totalAmount.toString(),
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

			if (validated.cakeBoxQty > 0) {
				orderDetails += `\n- Ochutnávková krabička dortů: ${validated.cakeBoxQty}x (${validated.cakeBoxQty * CAKE_BOX_PRICE} Kč)`;
			}

			if (validated.sweetbarBoxQty > 0) {
				orderDetails += `\n- Ochutnávková krabička sweetbar: ${validated.sweetbarBoxQty}x (${validated.sweetbarBoxQty * SWEETBAR_BOX_PRICE} Kč)`;
			}

			orderDetails += `\n\nCelková částka: ${totalAmount} Kč`;

			// Send admin notification email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: ["mr.sucik@gmail.com", "pandidorty@gmail.com"],
				subject: `🎄 Nová vánoční cukrovía #${newOrder.orderNumber} - ${validated.name}`,
				text: `
Nová objednávka vánoční cukrovíy!

Číslo objednávky: ${newOrder.orderNumber}
Datum přijetí: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: cs })}

KONTAKTNÍ ÚDAJE:
Jméno: ${validated.name}
Email: ${validated.email}
Telefon: ${validated.phone}

DATUM VYZVEDNUTÍ:
${format(parseISO(validated.date), "dd.MM.yyyy (EEEE)", { locale: cs })}

${orderDetails}
`,
			});

			// Send customer confirmation email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: validated.email,
				subject: `🎄 Potvrzení objednávky vánoční cukrovíy #${newOrder.orderNumber}`,
				text: `
Dobrý den ${validated.name},

děkujeme za Vaši objednávku vánoční cukrovíy! Tímto potvrzujeme, že jsme ji přijali.

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${newOrder.orderNumber}
Datum vyzvednutí: ${format(parseISO(validated.date), "dd.MM.yyyy (EEEE)", { locale: cs })}

${orderDetails}

PLATEBNÍ INSTRUKCE:
Pro dokončení objednávky prosím uhraďte částku ${totalAmount} Kč pomocí QR kódu, který najdete v potvrzovací zprávě na webu, nebo převodem na náš účet. Po obdržení platby Vám zašleme finální potvrzení.

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
				"Děkujeme! Vaše objednávka vánoční cukrovíy byla úspěšně odeslána.",
			orderId: newOrder.orderNumber,
			orderDetails: {
				id: newOrder.id,
				orderNumber: newOrder.orderNumber,
				customerName: newOrder.customerName,
				deliveryDate: newOrder.deliveryDate,
				cakeBoxQty: validated.cakeBoxQty,
				sweetbarBoxQty: validated.sweetbarBoxQty,
				totalAmount,
			},
		};
	} catch (error) {
		console.error("💥 Error processing Christmas order:", error);
		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
