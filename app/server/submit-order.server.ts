import { createServerFn } from '@tanstack/react-start'
import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns"
import { cs } from "date-fns/locale"
import { z } from "zod"
import { createOrderFromForm, type OrderFormData } from "../db/orders"

// Helper function for date validation
const isValidDeliveryDate = (dateString: string): boolean => {
	try {
		const selectedDate = parseISO(dateString)
		const minDate = addDays(startOfDay(new Date()), 7)
		return (
			isAfter(selectedDate, minDate) ||
			selectedDate.getTime() === minDate.getTime()
		)
	} catch {
		return false
	}
}

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
			return data.orderCake || data.orderDessert
		},
		{
			message: "Vyberte alespoň jednu možnost: Dort nebo Dezert",
		},
	)
	.refine(
		(data) => {
			// If cake is selected, size and flavor are required
			if (data.orderCake) {
				return data.size.trim() !== "" && data.flavor.trim() !== ""
			}
			return true
		},
		{
			message: "Při objednávce dortu jsou povinné údaje o velikosti a příchuti",
		},
	)
	.refine(
		(data) => {
			// If dessert is selected, dessertChoice is required
			if (data.orderDessert) {
				return data.dessertChoice.trim() !== ""
			}
			return true
		},
		{
			message: "Při objednávce dezertů je povinný výběr dezertů",
		},
	)

export const submitOrderFn = createServerFn({
	method: 'POST',
})
	.validator((formData: FormData) => {
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
		}

		// Handle file uploads
		const photos = formData.getAll("photos") as File[]

		// Validate with Zod
		const validationResult = orderSchema.safeParse(orderData)

		if (!validationResult.success) {
			const errorMessages = validationResult.error.errors.map(
				(err) => err.message,
			)
			throw new Error(errorMessages.join(", "))
		}

		return { orderData, photos }
	})
	.handler(async ({ data: { orderData, photos } }) => {
		try {
			console.log("📝 Processing order submission...")

			// Handle file uploads
			const photoInfo = photos
				.filter((file) => file.size > 0) // Filter out empty files
				.map((file) => ({
					name: file.name,
					size: file.size,
					type: file.type,
				}))

			// ✅ Order validation passed - now save to database
			console.log("✅ Order validation passed! Saving to database...")
			console.log("👤 Customer Info:", {
				name: orderData.name,
				email: orderData.email,
				phone: orderData.phone,
				deliveryDate: orderData.date,
				deliveryDateFormatted: format(
					parseISO(orderData.date),
					"dd.MM.yyyy (EEEE)",
					{ locale: cs },
				),
			})

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
			})

			if (photoInfo.length > 0) {
				console.log("📸 Uploaded Photos:", photoInfo)
			}

			// 💾 Save order to database
			const dbResult = await createOrderFromForm(orderData as OrderFormData, photos)
			
			if (!dbResult.success) {
				console.error("❌ Failed to save order to database:", dbResult.error)
				throw new Error("Došlo k chybě při ukládání objednávky. Zkuste to prosím později.")
			}

			// At this point TypeScript knows dbResult.success is true
			const savedOrder = dbResult.order
			console.log("💾 Order saved to database with ID:", savedOrder.id)
			console.log("📧 TODO: Send confirmation email to customer")
			console.log("🔔 TODO: Send admin notification")
			
			if (savedOrder.photos && savedOrder.photos.length > 0) {
				console.log("📸 Photos saved:", savedOrder.photos.length)
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
					status: savedOrder.status,
					photoCount: savedOrder.photos?.length || 0,
				},
			}
		} catch (error) {
			console.error("💥 Error processing order:", error)
			throw new Error("Došlo k chybě při zpracování objednávky. Zkuste to prosím později.")
		}
	}) 