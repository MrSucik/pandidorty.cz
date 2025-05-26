import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	addDays,
	format,
	isAfter,
	parseISO,
	startOfDay,
} from "date-fns";
import { cs } from "date-fns/locale";
import {
	useForm as useReactHookForm,
	SubmitHandler,
	Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Helper function for date validation
const isValidDeliveryDate = (dateString: string): boolean => {
	try {
		const today = startOfDay(new Date());
		const minDate = addDays(today, 7);
		const selectedDate = parseISO(dateString);
		return (
			isAfter(selectedDate, minDate) ||
			selectedDate.getTime() === minDate.getTime()
		);
	} catch {
		return false;
	}
};

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Create a safe FileList schema that works in both client and server environments
const fileListSchema = isBrowser ? z.instanceof(FileList).nullable() : z.any().nullable();

// Zod validation schemas
const orderFormSchema = z
	.object({
		name: z.string().min(1, "Toto pole je povinné").min(2, "Jméno musí mít alespoň 2 znaky"),
		email: z.string().min(1, "Toto pole je povinné").email("Zadejte platnou emailovou adresu"),
		phone: z.string().min(1, "Toto pole je povinné").min(9, "Telefon musí mít alespoň 9 číslic"),
		date: z
			.string()
			.min(1, "Toto pole je povinné")
			.refine(isValidDeliveryDate, "Datum dodání musí být alespoň 7 dní od dnes"),
		orderCake: z.boolean(),
		orderDessert: z.boolean(),
		size: z.string(),
		flavor: z.string(),
		dessertChoice: z.string(),
		message: z.string(),
		photos: fileListSchema,
	})
	.refine(
		(data) => {
			return data.orderCake || data.orderDessert;
		},
		{
			message: "Vyberte prosím alespoň jednu možnost: Dort nebo Dezert",
			path: ["orderCake"],
		},
	)
	.refine(
		(data) => {
			if (data.orderCake) {
				return data.size.trim() !== "" && data.flavor.trim() !== "";
			}
			return true;
		},
		{
			message: "Při objednávce dortu jsou povinné údaje o velikosti a příchuti",
			path: ["size"],
		},
	)
	.refine(
		(data) => {
			if (data.orderDessert) {
				return data.dessertChoice.trim() !== "";
			}
			return true;
		},
		{
			message: "Při objednávce dezertů je povinný výběr dezertů",
			path: ["dessertChoice"],
		},
	);

type OrderFormData = z.infer<typeof orderFormSchema>;
interface OrderResponse {
	success: boolean;
	message?: string;
	error?: string;
	orderId?: string;
}

const submitOrder = async (formData: FormData): Promise<OrderResponse> => {
	const response = await fetch("/api/submit-order", {
		method: "POST",
		body: formData,
	});

	const result = (await response.json()) as OrderResponse;

	if (!response.ok) {
		throw new Error(result.error || "Došlo k chybě při odesílání formuláře.");
	}

	return result;
};

export const Route = createFileRoute("/order")({
	component: OrderForm,
});

function OrderForm() {
	// Initialize default date (yyyy-MM-dd)
	const today = startOfDay(new Date());
	const minDate = addDays(today, 7);
	const defaultDate = format(minDate, "yyyy-MM-dd", { locale: cs });

	const submitOrderMutation = useMutation({
		mutationFn: submitOrder,
	});

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useReactHookForm<OrderFormData>({
		resolver: zodResolver(orderFormSchema),
		mode: "onChange",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			date: defaultDate,
			orderCake: true,
			orderDessert: false,
			size: "",
			flavor: "",
			dessertChoice: "",
			message: "",
			photos: null,
		},
	});

	const orderCake = watch("orderCake");
	const orderDessert = watch("orderDessert");

	const onSubmit: SubmitHandler<OrderFormData> = async (value) => {
		const formData = new FormData();

		for (const [key, val] of Object.entries(value)) {
			if (key === "photos" && isBrowser && val instanceof FileList) {
				for (const file of Array.from(val)) {
					formData.append("photos", file);
				}
			} else if (typeof val === "boolean") {
				formData.append(key, val.toString());
			} else if (val !== null && val !== undefined) {
				formData.append(key, val.toString());
			}
		}

		submitOrderMutation.mutate(formData, {
			onSuccess: () => {
				reset();
			},
		});
	};

	// Success state UI
	if (submitOrderMutation.isSuccess) {
		return (
			<div className="min-h-screen relative">
				<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
					<div className="bg-flowers h-full w-full -z-10" />
				</div>

				<div className="max-w-4xl mx-auto px-4 py-12">
					<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
						<h1 className="text-3xl md:text-4xl font-bold text-center mb-8 mt-12">
							Objednávka
						</h1>

						<div className="text-center p-8">
							<h2 className="text-2xl font-semibold text-green-600 mb-4">
								{submitOrderMutation.data?.message || "Objednávka byla úspěšně odeslána!"}
							</h2>
							<a
								href="/"
								className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
							>
								Zpět na hlavní stránku
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen relative">
			<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
				<div className="bg-flowers h-full w-full -z-10" />
			</div>

			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-8 mt-12">
						Objednávka
					</h1>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{/* Form-level error */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
								{Object.values(errors).map((err) => (err as any).message).join(", ")}
							</div>
						)}

						{/* TanStack Query mutation error */}
						{submitOrderMutation.error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
								{submitOrderMutation.error.message}
							</div>
						)}

						<div className="space-y-8">
							{/* Contact information section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Kontaktní údaje
								</h2>
								<div className="grid gap-6 md:grid-cols-2">
									{/* Name field */}
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="name">
											Jméno a příjmení *
										</label>
										<input
											type="text"
											id="name"
											{...register("name")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.name ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.name && (
											<p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
										)}
								</div>

								{/* Email field */}
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="email">
											Email *
										</label>
										<input
											type="email"
											id="email"
											{...register("email")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.email ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.email && (
											<p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
										)}
								</div>
							</div>

							<div className="grid gap-6 md:grid-cols-2 mt-6">
								{/* Phone field */}
								<div>
									<label className="block text-sm font-medium mb-2" htmlFor="phone">
										Telefon *
									</label>
									<input
										type="tel"
										id="phone"
										{...register("phone")}
										className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"}`}
									/>
									{errors.phone && (
										<p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
									)}
								</div>

								{/* Date field */}
								<div>
									<label className="block text-sm font-medium mb-2" htmlFor="date">
										Datum dodání *
									</label>
									<input
										type="date"
										id="date"
										min={defaultDate}
										{...register("date")}
										className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.date ? "border-red-300 bg-red-50" : "border-gray-300"}`}
									/>
									<p className="text-sm text-gray-500 mt-1">Objednávky přijímáme minimálně 7 dní předem</p>
									{errors.date && (
										<p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
									)}
								</div>
							</div>
						</div>

						{/* Order type selection section */}
						<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
							<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
								Výběr objednávky
							</h2>

							<div className="mb-4">
								<fieldset>
									<legend className="block text-sm font-medium mb-2">Co si přejete objednat? *</legend>
									<div className="flex space-x-6">
										<label className="inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												className="form-checkbox h-5 w-5 text-pink-500"
												{...register("orderCake")}
											/>
											<span className="ml-2 text-lg">Dort</span>
										</label>

										<label className="inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												className="form-checkbox h-5 w-5 text-pink-500"
												{...register("orderDessert")}
											/>
											<span className="ml-2 text-lg">Dezert</span>
										</label>
									</div>
								</fieldset>
							</div>

							{/* Cake form section */}
							<div className={`bg-pink-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${orderCake ? "block opacity-100" : "hidden opacity-0"}`}>
								<h3 className="font-medium text-pink-800 mb-3">Parametry dortu</h3>
								<div className="grid gap-6 md:grid-cols-2">
									{/* Size */}
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="size">
											Počet porcí{orderCake ? " *" : ""}
										</label>
										<input
											type="text"
											id="size"
											{...register("size")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.size ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.size && (
											<p className="text-red-600 text-sm mt-1">{errors.size.message}</p>
										)}
								</div>

								{/* Flavor */}
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="flavor">
											Vybraná příchuť{orderCake ? " *" : ""}
										</label>
										<input
											type="text"
											id="flavor"
											{...register("flavor")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.flavor ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.flavor && (
											<p className="text-red-600 text-sm mt-1">{errors.flavor.message}</p>
										)}
								</div>
								</div>
							</div>

							{/* Dessert form section */}
							<div className={`bg-blue-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${orderDessert ? "block opacity-100" : "hidden opacity-0"}`}>
								<h3 className="font-medium text-blue-800 mb-3">Parametry dezertů</h3>
								<div>
									<label className="block text-sm font-medium mb-2" htmlFor="dessertChoice">
										Výběr dezertů{orderDessert ? " *" : ""}
									</label>
									<textarea
										id="dessertChoice"
										rows={3}
										{...register("dessertChoice")}
										placeholder="Uveďte prosím dezerty, o které máte zájem, včetně množství a příchuti (např. 12x karamelový větrník)"
										className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.dessertChoice ? "border-red-300 bg-red-50" : "border-gray-300"}`}
									/>
									{errors.dessertChoice && (
										<p className="text-red-600 text-sm mt-1">{errors.dessertChoice.message}</p>
									)}
								</div>
							</div>
						</div>

						{/* Additional information section - visible only when cake is selected (CSS only) */}
						<div className={`${orderCake ? "block" : "hidden"} transition-opacity duration-300 ease-in-out`}>
							{/* Cake-specific fields */}
							<div className="mb-6">
								<div className="mb-6">
									<label className="block text-sm font-medium mb-2" htmlFor="message">
										Vaše představa dortu
									</label>
									<textarea
										id="message"
										rows={4}
										{...register("message")}
										className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
									/>
								</div>

								{/* Photos */}
								<div>
									<label className="block text-sm font-medium mb-2" htmlFor="photos">
										Fotografie pro inspiraci (můžete nahrát více fotografií)
									</label>
									<div className="relative">
										<input
											type="file"
											id="photos"
											accept="image/*"
											multiple
											{...register("photos")}
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
										/>
										<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											<span className="text-sm">Vyberte více souborů</span>
										</div>
									</div>
									<p className="text-sm text-gray-500 mt-1">Můžete nahrát více fotografií pro lepší představu o vašem vysněném dortu (držte Ctrl nebo Cmd pro výběr více souborů)</p>
									<p className="text-sm text-gray-500 mt-1">Podporované formáty: JPG, PNG, GIF, WEBP. Maximální velikost: 1 MB na soubor.</p>
								</div>
							</div>
						</div>

						{/* Info text for dessert-only orders */}
						<p className={`${!orderCake && orderDessert ? "block" : "hidden"} text-center text-gray-500 italic py-4 transition-opacity duration-300 ease-in-out`}>
							Pro objednávku dezertů nejsou potřeba další informace.
						</p>
						</div>

						<div className="text-center">
							<button
								type="submit"
								disabled={isSubmitting || submitOrderMutation.isPending}
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors relative disabled:opacity-50"
							>
								{submitOrderMutation.isPending || isSubmitting ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Odesílám...
									</span>
								) : (
									<span>Odeslat objednávku</span>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
} 