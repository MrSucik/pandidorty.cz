import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { Resend } from "resend";
import { z } from "zod";
import { type OrderFormData, createOrderFromForm } from "../db/orders";
import { isDateBlocked } from "./blocked-dates.server";

// Helper function for date validation
const isValidDeliveryDate = (dateString: string): boolean => {
	try {
		const selectedDate = parseISO(dateString);
		const minDate = addDays(startOfDay(new Date()), 7);
		return (
			isAfter(selectedDate, minDate) ||
			selectedDate.getTime() === minDate.getTime()
		);
	} catch {
		return false;
	}
};

// Zod schema for order validation
const orderSchema = z
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
			.min(1, "Datum dodání je povinné")
			.refine(
				isValidDeliveryDate,
				"Datum dodání musí být alespoň 7 dní od dnes",
			),
		orderCake: z.boolean(),
		orderDessert: z.boolean(),
		size: z.string(),
		flavor: z.string(),
		dessertChoice: z.string(),
		message: z.string(),
	})
	.refine(
		(data) => {
			// At least one option must be selected
			return data.orderCake || data.orderDessert;
		},
		{
			message: "Vyberte alespoň jednu možnost: Dort nebo Dezert",
		},
	)
	.refine(
		(data) => {
			// If cake is selected, size and flavor are required
			if (data.orderCake) {
				return data.size.trim() !== "" && data.flavor.trim() !== "";
			}
			return true;
		},
		{
			message: "Při objednávce dortu jsou povinné údaje o velikosti a příchuti",
		},
	)
	.refine(
		(data) => {
			// If dessert is selected, dessertChoice is required
			if (data.orderDessert) {
				return data.dessertChoice.trim() !== "";
			}
			return true;
		},
		{
			message: "Při objednávce dezertů je povinný výběr dezertů",
		},
	);

export interface SubmitOrderResult {
	success: boolean;
	message: string;
	orderId: string;
	orderDetails: {
		id: number;
		orderNumber: string;
		customerName: string;
		deliveryDate: Date;
		photoCount: number;
	};
}

// Helper function to process file to buffer
async function processFileToBuffer(
	file: File,
): Promise<{ filename: string; content: Buffer }> {
	const arrayBuffer = await file.arrayBuffer();
	return {
		filename: file.name,
		content: Buffer.from(arrayBuffer),
	};
}

// Main function to be called from the API route
export async function submitOrder(
	formData: FormData,
): Promise<SubmitOrderResult> {
	// Extract form fields
	const orderData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: formData.get("phone") as string,
		date: formData.get("date") as string,
		orderCake: formData.get("orderCake") === "true",
		orderDessert: formData.get("orderDessert") === "true",
		size: (formData.get("size") as string) || "",
		flavor: (formData.get("flavor") as string) || "",
		dessertChoice: (formData.get("dessertChoice") as string) || "",
		message: (formData.get("message") as string) || "",
	};

	// Handle file uploads
	const photos = formData.getAll("photos") as File[];

	// Validate with Zod
	const validationResult = orderSchema.safeParse(orderData);

	if (!validationResult.success) {
		const errorMessages = validationResult.error.errors.map(
			(err) => err.message,
		);
		throw new Error(errorMessages.join(", "));
	}

	// Check if the selected date is blocked
	const dateIsBlocked = await isDateBlocked(orderData.date);
	if (dateIsBlocked) {
		throw new Error("Vybraný termín není dostupný. Zvolte prosím jiný termín.");
	}

	try {
		console.log("📝 Processing order submission...");

		// Handle file uploads (just for logging purposes)
		const photoInfo = photos
			.filter((file) => file.size > 0) // Filter out empty files
			.map((file) => ({
				name: file.name,
				size: file.size,
				type: file.type,
			}));

		// ✅ Order validation passed - now save to database
		console.log("✅ Order validation passed! Saving to database...");
		console.log("👤 Customer Info:", {
			name: orderData.name,
			email: orderData.email,
			phone: orderData.phone,
			deliveryDate: orderData.date,
			deliveryDateFormatted: format(
				parseISO(orderData.date),
				"dd.MM.yyyy (EEEE)",
				{
					locale: cs,
				},
			),
		});

		console.log("🛒 Order Details:", {
			orderCake: orderData.orderCake,
			orderDessert: orderData.orderDessert,
			...(orderData.orderCake && {
				cakeSize: orderData.size,
				cakeFlavor: orderData.flavor,
				cakeMessage: orderData.message || "No special message",
			}),
			...(orderData.orderDessert && {
				dessertChoice: orderData.dessertChoice,
			}),
		});

		if (photoInfo.length > 0) {
			console.log("📸 Uploaded Photos:", photoInfo);
		}

		// 💾 Save order to database
		const dbResult = await createOrderFromForm(
			orderData as OrderFormData,
			photos,
		);

		if (!dbResult.success) {
			console.error("❌ Failed to save order to database:", dbResult.error);
			throw new Error(
				"Došlo k chybě při ukládání objednávky. Zkuste to prosím později.",
			);
		}

		// At this point TypeScript knows dbResult.success is true
		const savedOrder = dbResult.order;
		console.log("💾 Order saved to database with ID:", savedOrder.id);

		// 📧 Send notification emails
		try {
			const resend = new Resend(process.env.RESEND_API_KEY);

			// Process attachments if photos exist
			const emailAttachments = [];
			const validPhotos = photos.filter((file) => file.size > 0);

			for (const photo of validPhotos) {
				try {
					const attachment = await processFileToBuffer(photo);
					emailAttachments.push(attachment);
				} catch (error) {
					console.error(`Error processing photo ${photo.name}:`, error);
				}
			}

			// Format attachment info
			const attachmentInfo =
				validPhotos.length > 0
					? `Přiložené fotografie: ${validPhotos.map((f) => f.name).join(", ")}`
					: "Bez přiložených fotografií";

			// Prepare order details
			let orderDetails = "Objednané položky:\n";

			if (orderData.orderCake) {
				orderDetails += `
- Dort
  Velikost/Počet porcí: ${orderData.size}
  Vybraná příchuť: ${orderData.flavor}
  ${orderData.message ? `Nápis na dort: ${orderData.message}` : ""}`;
			}

			if (orderData.orderDessert) {
				orderDetails += `
- Dezerty
  ${orderData.dessertChoice}`;
			}

			// Send admin notification email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@blaze.codes>",
				to: ["mr.sucik@gmail.com", "pandidorty@gmail.com"],
				subject: `Nová objednávka #${savedOrder.orderNumber} - ${orderData.name}`,
				text: `
Nová objednávka byla přijata!

Číslo objednávky: ${savedOrder.orderNumber}
Datum přijetí: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: cs })}

KONTAKTNÍ ÚDAJE:
Jméno: ${orderData.name}
Email: ${orderData.email}
Telefon: ${orderData.phone}

DATUM DODÁNÍ:
${format(parseISO(orderData.date), "dd.MM.yyyy (EEEE)", { locale: cs })}

${orderDetails}

${orderData.message ? `\nPOZNÁMKA OD ZÁKAZNÍKA:\n${orderData.message}` : ""}

${attachmentInfo}
`,
				attachments: emailAttachments,
			});

			console.log("📧 Admin notification email sent successfully");

			// Send customer confirmation email
			await resend.emails.send({
				from: "Pandí Dorty <pandidorty@blaze.codes>",
				to: orderData.email,
				subject: `Potvrzení objednávky #${savedOrder.orderNumber} - Pandí Dorty`,
				text: `
Dobrý den ${orderData.name},

děkujeme za Vaši objednávku! Tímto potvrzujeme, že jsme ji přijali a brzy se Vám ozveme s dalšími detaily.

SHRNUTÍ OBJEDNÁVKY:
Číslo objednávky: ${savedOrder.orderNumber}
Datum dodání: ${format(parseISO(orderData.date), "dd.MM.yyyy (EEEE)", { locale: cs })}

${orderDetails}

${orderData.message ? `\nVaše poznámka: ${orderData.message}` : ""}

Pokud budete mít jakékoliv dotazy, neváhejte nás kontaktovat na pandidorty@gmail.com nebo na telefonním čísle uvedeném na našich stránkách.

S pozdravem,
Tým Pandí Dorty
`,
			});

			console.log("📧 Customer confirmation email sent successfully");
		} catch (emailError) {
			console.error("⚠️ Error sending emails:", emailError);
			// Don't throw here - the order was saved successfully
			// Just log the error and continue
		}

		if (savedOrder.photos && savedOrder.photos.length > 0) {
			console.log("📸 Photos saved:", savedOrder.photos.length);
		}

		// Return success response with real order data
		return {
			success: true,
			message:
				"Děkujeme! Vaše objednávka byla úspěšně odeslána. Brzy se Vám ozveme.",
			orderId: savedOrder.orderNumber,
			orderDetails: {
				id: savedOrder.id,
				orderNumber: savedOrder.orderNumber,
				customerName: savedOrder.customerName,
				deliveryDate: savedOrder.deliveryDate,
				photoCount: savedOrder.photos?.length || 0,
			},
		};
	} catch (error) {
		console.error("💥 Error processing order:", error);
		throw new Error(
			"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
		);
	}
}
