import { Resend } from "resend";
import { z } from "zod";
import {
	CHRISTMAS_ORDER_CONFIG,
	CHRISTMAS_SWEETS_OPTIONS,
} from "../data/christmas-sweets";
import { db, orders } from "../db";
import { calculatePaymentDetails } from "../utils/payment-helpers";

// Placeholder date for orders without a specific pickup date
// Set to far future to indicate it needs to be scheduled
const PLACEHOLDER_DELIVERY_DATE = new Date("2099-12-31");

// Verify RESEND_API_KEY is set at module load time
if (!process.env.RESEND_API_KEY) {
	throw new Error(
		"RESEND_API_KEY environment variable is not set. Email functionality will not work.",
	);
}

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
	)
	.refine(
		(data) => {
			// Calculate total order amount and check minimum
			let totalAmount = 0;
			for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
				const quantity = (data as any)[`quantity_${sweet.id}`] || 0;
				totalAmount += quantity * sweet.pricePer100g;
			}
			return totalAmount >= CHRISTMAS_ORDER_CONFIG.minimumOrder;
		},
		{
			message: `Minimální hodnota objednávky je ${CHRISTMAS_ORDER_CONFIG.minimumOrder} Kč`,
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
				deliveryDate: PLACEHOLDER_DELIVERY_DATE,
				orderKind: "christmas_sweets", // Changed from "christmas_tasting"
				orderCake: false,
				orderDessert: false,
				cakeSize: null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: null,
				tastingCakeBoxQty: null,
				tastingSweetbarBoxQty: null,
				tastingNotes: null, // Only for tasting orders
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

KONTAKTNÍ ÚDAJE:
Jméno: ${validated.name}
Email: ${validated.email}
Telefon: ${validated.phone}

${orderDetails}
`,
			});

			// Calculate payment details using shared helper
			const paymentDetails = calculatePaymentDetails(
				totalAmount,
				CHRISTMAS_ORDER_CONFIG.deposit,
			);

			// Prepare HTML order items for email
			const htmlOrderItems = orderItems
				.map(
					(item) => `
				<div style="margin-bottom: 10px;">
					<strong>${item.name}</strong><br>
					Množství: ${item.quantity} x 100g<br>
					Cena za 100g: ${item.pricePerUnit} Kč<br>
					<strong>Celkem: ${item.totalPrice} Kč</strong>
				</div>
				<hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
			`,
				)
				.join("");

			// Send customer confirmation email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
				to: validated.email,
				subject: `🎄 Potvrzení objednávky vánočního cukroví #${newOrder.orderNumber}`,
				html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<h2 style="color: #d97706;">🎄 Potvrzení objednávky vánočního cukroví</h2>

	<p>Dobrý den ${validated.name},</p>

	<p>děkujeme za Vaši objednávku vánočního cukroví! Tímto potvrzujeme, že jsme ji přijali.</p>

	<div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
		<h3 style="margin-top: 0;">SHRNUTÍ OBJEDNÁVKY:</h3>
		<p><strong>Číslo objednávky:</strong> ${newOrder.orderNumber}</p>
		<div style="margin-top: 15px;">
			<strong>OBJEDNANÉ CUKROVÍ:</strong>
			<div style="margin-top: 10px;">
				${htmlOrderItems}
			</div>
			<div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #d1d5db;">
				<strong>CELKOVÁ HMOTNOST:</strong> ${totalWeight}g (${totalWeight / 1000}kg)<br>
				<strong style="font-size: 1.2em; color: #059669;">CELKOVÁ ČÁSTKA: ${totalAmount} Kč</strong>
			</div>
		</div>
	</div>

	<div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fbbf24;">
		<h3 style="margin-top: 0; color: #92400e;">💳 PLATEBNÍ INSTRUKCE:</h3>
		<p>Pro dokončení objednávky prosím uhraďte <strong style="font-size: 1.2em; color: #1e40af;">${paymentDetails.paymentDescription}</strong> pomocí QR kódu níže nebo převodem na náš účet.</p>

		${paymentDetails.hasBalance ? `<p style="background-color: #fff; padding: 10px; border-radius: 5px;">Doplatek uhradíte při vyzvednutí.</p>` : ""}

		<div style="text-align: center; margin: 20px 0;">
			<p style="margin-bottom: 10px;"><strong>Naskenujte QR kód ve vaší bankovní aplikaci:</strong></p>
			<img src="https://pandidorty.cz${CHRISTMAS_ORDER_CONFIG.qrCodePath}" alt="QR kód pro platbu" style="max-width: 300px; width: 100%; border: 2px solid #d1d5db; border-radius: 8px;">
		</div>

		<p style="font-size: 0.9em; color: #4b5563;">${CHRISTMAS_ORDER_CONFIG.description}</p>
		<p style="font-size: 0.9em; color: #4b5563;">${paymentDetails.confirmationMessage}</p>
	</div>

	<p>Termín vyzvednutí domluvíme individuálně.</p>

	<p>Pokud budete mít jakékoliv dotazy, neváhejte nás kontaktovat na <a href="mailto:pandidorty@gmail.com" style="color: #d97706;">pandidorty@gmail.com</a>.</p>

	<p style="margin-top: 30px;">S pozdravem,<br><strong>Tým Pandí Dorty</strong></p>
</body>
</html>
			`,
				text: `
Dobrý den ${validated.name},

děkujeme za Vaši objednávku vánočního cukroví! Tímto potvrzujeme, že jsme ji přijali.

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${newOrder.orderNumber}

${orderDetails}

PLATEBNÍ INSTRUKCE:
Pro dokončení objednávky prosím uhraďte ${paymentDetails.paymentDescription} pomocí QR kódu nebo převodem na náš účet. ${paymentDetails.confirmationMessage}

${paymentDetails.hasBalance ? `Doplatek uhradíte při vyzvednutí.` : ""}

QR kód pro platbu najdete v HTML verzi tohoto emailu nebo na potvrzovací stránce.

Termín vyzvednutí domluvíme individuálně.

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
