import { addDays, format } from "date-fns";
import { cs } from "date-fns/locale";
import { count, eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { MDZ_DATA } from "../data/mdz";
import { db, orders } from "../db";

// Check if email is configured (but don't crash if not)
const isEmailConfigured = !!process.env.RESEND_API_KEY;

// Zod schema for MDZ order validation
const mdzSchema = z.object({
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
	productChoice: z.enum(["withFlowers", "dessertsOnly"], {
		message: "Vyberte prosím jednu z možností",
	}),
});

export interface SubmitMdzResult {
	success: boolean;
	message: string;
	orderId: string;
	orderDetails: {
		id: number;
		orderNumber: string;
		customerName: string;
		productChoice: string;
		price: number;
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
		productChoice: formData.get("productChoice") as string,
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
	const withFlowers = validated.productChoice === "withFlowers";
	const product = withFlowers
		? MDZ_DATA.products.withFlowers
		: MDZ_DATA.products.dessertsOnly;

	try {
		const orderNumber = generateOrderNumber();
		const defaultDeliveryDate = addDays(new Date(), 7);

		const [newOrder] = await db
			.insert(orders)
			.values({
				orderNumber,
				customerName: validated.name,
				customerEmail: validated.email,
				customerPhone: validated.phone,
				deliveryDate: defaultDeliveryDate,
				orderKind: "mdz",
				orderCake: withFlowers,
				orderDessert: true,
				cakeSize: null,
				cakeFlavor: null,
				cakeMessage: null,
				dessertChoice: withFlowers ? "zakusky_kytice" : "zakusky",
				tastingCakeBoxQty: null,
				tastingSweetbarBoxQty: null,
				tastingNotes: null,
				shippingAddress: null,
				billingAddress: null,
				totalAmount: product.price.toString(),
				notes: null,
				createdById: null,
				updatedById: null,
			})
			.returning();

		// Send notification emails
		try {
			const orderDetailsText = withFlowers
				? `${MDZ_DATA.products.withFlowers.name} (${MDZ_DATA.products.withFlowers.price} Kč)`
				: `${MDZ_DATA.products.dessertsOnly.name} (${MDZ_DATA.products.dessertsOnly.price} Kč)`;

			if (isEmailConfigured) {
				const resend = new Resend(process.env.RESEND_API_KEY);

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

OBJEDNÁVKA:
${orderDetailsText}
`,
				});

				// Send customer confirmation email
				await resend.emails.send({
					from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
					to: validated.email,
					subject: `Potvrzení objednávky ke Dni žen #${newOrder.orderNumber}`,
					text: `
Dobrý den ${validated.name},

děkujeme za Vaši objednávku ke Dni žen!

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${newOrder.orderNumber}
${orderDetailsText}

Vyzvednutí proběhne ${MDZ_DATA.pickupDate}:
- Poruba u Pandy (Pod Nemocnicí 2026/65): 10:00–11:00
- centrum u Nedbalek: 11:30–12:00
${MDZ_DATA.pickupNote}

${MDZ_DATA.payment.description}

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
		}

		return {
			success: true,
			message:
				"Děkujeme! Vaše objednávka ke Dni žen byla úspěšně odeslána.",
			orderId: newOrder.orderNumber,
			orderDetails: {
				id: newOrder.id,
				orderNumber: newOrder.orderNumber,
				customerName: newOrder.customerName,
				productChoice: validated.productChoice,
				price: product.price,
			},
		};
	} catch (error) {
		console.error("Error processing MDZ order:", error);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
