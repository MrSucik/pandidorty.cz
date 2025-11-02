import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { Resend } from "resend";
import { z } from "zod";
import {
	CHRISTMAS_PAYMENT_INFO,
	CHRISTMAS_SWEETS_OPTIONS,
} from "../data/christmas-sweets";
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

// Create dynamic schema for candy quantities
const createQuantitySchema = () => {
	const quantityFields: Record<string, z.ZodTypeAny> = {};
	for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
		quantityFields[`quantity_${sweet.id}`] = z.coerce
			.number()
			.int()
			.min(0)
			.default(0);
	}
	return quantityFields;
};

// Zod schema for Christmas candy order validation
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
		...createQuantitySchema(),
	})
	.refine(
		(data) => {
			// At least one candy must have quantity > 0
			const hasAnyQuantity = CHRISTMAS_SWEETS_OPTIONS.some((sweet) => {
				const qty = (data as any)[`quantity_${sweet.id}`] || 0;
				return qty > 0;
			});
			return hasAnyQuantity;
		},
		{
			message: "Vyberte alespoň jedno cukroví",
		},
	);

export interface ChristmasCandyOrderItem {
	sweetId: string;
	name: string;
	quantity: number; // in 100g units
	pricePerUnit: number;
	totalPrice: number;
}

export interface SubmitChristmasOrderResult {
	success: boolean;
	message: string;
	orderId: string;
	orderDetails: {
		id: number;
		orderNumber: string;
		customerName: string;
		deliveryDate: Date;
		orderItems: ChristmasCandyOrderItem[];
		totalAmount: number;
		totalWeight: number; // in grams
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
	const orderData: Record<string, any> = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: formData.get("phone") as string,
		date: formData.get("date") as string,
	};

	// Extract quantities for each candy type
	for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
		const quantityKey = `quantity_${sweet.id}`;
		orderData[quantityKey] = formData.get(quantityKey) || 0;
	}

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

	// Build order items list with only selected candies
	const orderItems: ChristmasCandyOrderItem[] = [];
	let totalAmount = 0;
	let totalWeight = 0;

	for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
		const quantity = (validated as any)[`quantity_${sweet.id}`] || 0;
		if (quantity > 0) {
			const itemTotal = quantity * sweet.pricePer100g;
			orderItems.push({
				sweetId: sweet.id,
				name: sweet.name,
				quantity,
				pricePerUnit: sweet.pricePer100g,
				totalPrice: itemTotal,
			});
			totalAmount += itemTotal;
			totalWeight += quantity * 100; // Convert to grams
		}
	}

	// Create a summary string for the database
	const orderSummary = orderItems
		.map(
			(item) => `${item.name}: ${item.quantity}x100g (${item.totalPrice} Kč)`,
		)
		.join("; ");

	try {
		const orderNumber = generateOrderNumber();

		// Save order to database
		const [newOrder] = await db
			.insert(orders)
			.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate: new Date(validated.date),
				orderKind: "christmas_sweets", // Changed from "christmas_tasting"
				orderCake: false,
				orderDessert: false,
				cakeSize: null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: null,
				tastingCakeBoxQty: null,
				tastingSweetbarBoxQty: null,
				tastingNotes: orderSummary, // Store the order summary here
				shippingAddress: null,
				billingAddress: null,
				totalAmount: totalAmount.toString(),
				notes: `Vánoční cukroví - celková hmotnost: ${totalWeight}g`,
				createdById: null,
				updatedById: null,
			})
			.returning();

		// Send notification emails
		try {
			const resend = new Resend(process.env.RESEND_API_KEY);

			// Prepare order details for email
			let orderDetails = "OBJEDNANÉ CUKROVÍ:\n";
			orderDetails += "─────────────────────────\n";

			for (const item of orderItems) {
				orderDetails += `${item.name}\n`;
				orderDetails += `  Množství: ${item.quantity} x 100g\n`;
				orderDetails += `  Cena za 100g: ${item.pricePerUnit} Kč\n`;
				orderDetails += `  Celkem: ${item.totalPrice} Kč\n`;
				orderDetails += `─────────────────────────\n`;
			}

			orderDetails += `\nCELKOVÁ HMOTNOST: ${totalWeight}g (${totalWeight / 1000}kg)\n`;
			orderDetails += `CELKOVÁ ČÁSTKA: ${totalAmount} Kč\n`;

			// Send admin notification email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: ["mr.sucik@gmail.com", "pandidorty@gmail.com"],
				subject: `🎄 Nová objednávka vánočního cukroví #${newOrder.orderNumber} - ${validated.name}`,
				text: `
Nová objednávka vánočního cukroví!

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
				subject: `🎄 Potvrzení objednávky vánočního cukroví #${newOrder.orderNumber}`,
				text: `
Dobrý den ${validated.name},

děkujeme za Vaši objednávku vánočního cukroví! Tímto potvrzujeme, že jsme ji přijali.

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${newOrder.orderNumber}
Datum vyzvednutí: ${format(parseISO(validated.date), "dd.MM.yyyy (EEEE)", { locale: cs })}

${orderDetails}

PLATEBNÍ INSTRUKCE:
Pro dokončení objednávky prosím uhraďte zálohu ${CHRISTMAS_PAYMENT_INFO.deposit} Kč pomocí QR kódu, který najdete v potvrzovací zprávě na webu, nebo převodem na náš účet. Po obdržení platby Vám zašleme finální potvrzení.

Doplatek ${totalAmount - CHRISTMAS_PAYMENT_INFO.deposit} Kč uhradíte při vyzvednutí.

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
				"Děkujeme! Vaše objednávka vánočního cukroví byla úspěšně odeslána.",
			orderId: newOrder.orderNumber,
			orderDetails: {
				id: newOrder.id,
				orderNumber: newOrder.orderNumber,
				customerName: newOrder.customerName,
				deliveryDate: newOrder.deliveryDate,
				orderItems,
				totalAmount,
				totalWeight,
			},
		};
	} catch (error) {
		console.error("💥 Error processing Christmas order:", error);
		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
