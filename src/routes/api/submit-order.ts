import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";
import { addDays } from "date-fns";

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
			.refine((date) => {
				const selectedDate = new Date(date);
				const minDate = addDays(new Date(), 7);
				return selectedDate >= minDate;
			}, "Datum dodání musí být alespoň 7 dní od dnes"),
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

export const APIRoute = createAPIFileRoute("/api/submit-order")({
	POST: async ({ request }) => {
		try {
			console.log("📝 Processing order submission...");

			// Parse form data
			const formData = await request.formData();

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
			const photoInfo = photos
				.filter((file) => file.size > 0) // Filter out empty files
				.map((file) => ({
					name: file.name,
					size: file.size,
					type: file.type,
				}));

			// Validate with Zod
			const validationResult = orderSchema.safeParse(orderData);

			if (!validationResult.success) {
				const errorMessages = validationResult.error.errors.map(
					(err) => err.message,
				);
				console.log("❌ Validation failed:", errorMessages);
				return json({ error: errorMessages.join(", ") }, { status: 400 });
			}

			// 🎯 DUMMY CONSOLE LOG AFTER VALIDATION (as requested)
			console.log("✅ Order validation passed! Order details:");
			console.log("👤 Customer Info:", {
				name: orderData.name,
				email: orderData.email,
				phone: orderData.phone,
				deliveryDate: orderData.date,
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

			console.log(
				"💾 In a real application, this data would be saved to database",
			);
			console.log("📧 In a real application, confirmation email would be sent");
			console.log("🔔 In a real application, admin notification would be sent");

			// Simulate processing time
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Return success response
			return json({
				success: true,
				message:
					"Děkujeme! Vaše objednávka byla úspěšně odeslána. Brzy se Vám ozveme.",
				orderId: `ORDER-${Date.now()}`, // Dummy order ID
			});
		} catch (error) {
			console.error("💥 Error processing order:", error);
			return json(
				{
					error:
						"Došlo k chybě při zpracování objednávky. Zkuste to prosím později.",
				},
				{ status: 500 },
			);
		}
	},
});
