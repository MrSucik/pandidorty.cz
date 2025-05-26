import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { z } from "zod";

export const Route = createFileRoute("/objednavka")({
	component: OrderForm,
});

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Create a safe FileList schema that works in both client and server environments
const fileListSchema = isBrowser
	? z.instanceof(FileList).nullable()
	: z.any().nullable(); // On server, just accept any value

// Zod validation schemas
const orderFormSchema = z
	.object({
		name: z
			.string()
			.min(1, "Toto pole je povinné")
			.min(2, "Jméno musí mít alespoň 2 znaky"),
		email: z
			.string()
			.min(1, "Toto pole je povinné")
			.email("Zadejte platnou emailovou adresu"),
		phone: z
			.string()
			.min(1, "Toto pole je povinné")
			.min(9, "Telefon musí mít alespoň 9 číslic"),
		date: z
			.string()
			.min(1, "Toto pole je povinné")
			.refine((date) => {
				const today = new Date();
				const minDate = addDays(today, 7);
				const selectedDate = new Date(date);
				return selectedDate >= minDate;
			}, "Datum dodání musí být alespoň 7 dní od dnes"),
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
			// At least one option must be selected
			return data.orderCake || data.orderDessert;
		},
		{
			message: "Vyberte prosím alespoň jednu možnost: Dort nebo Dezert",
			path: ["orderCake"], // This will show the error on the orderCake field
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
			path: ["size"],
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
			path: ["dessertChoice"],
		},
	);

// Individual field schemas for field-level validation
const nameSchema = z
	.string()
	.min(1, "Toto pole je povinné")
	.min(2, "Jméno musí mít alespoň 2 znaky");

const emailSchema = z
	.string()
	.min(1, "Toto pole je povinné")
	.email("Zadejte platnou emailovou adresu");

const phoneSchema = z
	.string()
	.min(1, "Toto pole je povinné")
	.min(9, "Telefon musí mít alespoň 9 číslic");

const dateSchema = z
	.string()
	.min(1, "Toto pole je povinné")
	.refine((date) => {
		const today = new Date();
		const minDate = addDays(today, 7);
		const selectedDate = new Date(date);
		return selectedDate >= minDate;
	}, "Datum dodání musí být alespoň 7 dní od dnes");

// Form data type inferred from Zod schema - following TanStack Form TypeScript recommendations
type OrderFormData = z.infer<typeof orderFormSchema>;

// API response type
interface OrderResponse {
	success: boolean;
	message?: string;
	error?: string;
	orderId?: string;
}

// Submit order function for TanStack Query
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

// Validation function helpers
const createZodValidator = (schema: z.ZodSchema<string>) => {
	return ({ value }: { value: string }) => {
		const result = schema.safeParse(value);
		return result.success ? undefined : result.error.errors[0]?.message;
	};
};

const createConditionalValidator = (
	condition: () => boolean,
	validator: (value: string) => string | undefined,
) => {
	return ({ value }: { value: string }) => {
		if (condition()) {
			return validator(value);
		}
		return undefined;
	};
};

function OrderForm() {
	// Initialize the default date
	const today = new Date();
	const minDate = addDays(today, 7);
	const defaultDate = format(minDate, "yyyy-MM-dd");

	// TanStack Query mutation for form submission
	const submitOrderMutation = useMutation({
		mutationFn: submitOrder,
	});

	// Form with proper TypeScript typing
	const form = useForm({
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
		} as OrderFormData,
		validators: {
			onChange: ({ value }) => {
				const result = orderFormSchema.safeParse(value);
				if (!result.success) {
					// Return the first error message
					return result.error.errors[0]?.message || "Validation error";
				}
				return undefined;
			},
		},
		onSubmit: async ({ value }) => {
			// Validate with Zod before submission
			const validationResult = orderFormSchema.safeParse(value);
			if (!validationResult.success) {
				// Let form validation handle the errors
				return;
			}

			// Create FormData for file upload
			const formData = new FormData();

			// Add all form fields with proper type checking
			for (const [key, val] of Object.entries(value)) {
				if (key === "photos" && isBrowser && val instanceof FileList) {
					// Handle multiple files
					for (const file of Array.from(val)) {
						formData.append("photos", file);
					}
				} else if (typeof val === "boolean") {
					formData.append(key, val.toString());
				} else if (val !== null && val !== undefined) {
					formData.append(key, val.toString());
				}
			}

			// Submit using TanStack Query mutation
			submitOrderMutation.mutate(formData);
		},
	});

	// Show success message if form was submitted successfully
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
								{submitOrderMutation.data?.message ||
									"Objednávka byla úspěšně odeslána!"}
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

					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						{/* Form-level error */}
						{form.state.errors.length > 0 && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
								{form.state.errors.join(", ")}
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
									<form.Field
										name="name"
										validators={{
											onChange: createZodValidator(nameSchema),
										}}
									>
										{(field) => (
											<div>
												<label
													className="block text-sm font-medium mb-2"
													htmlFor={field.name}
												>
													Jméno a příjmení *
												</label>
												<input
													type="text"
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
														field.state.meta.errors.length > 0
															? "border-red-300 bg-red-50"
															: "border-gray-300"
													}`}
												/>
												{field.state.meta.errors.length > 0 && (
													<p className="text-red-600 text-sm mt-1">
														{field.state.meta.errors.join(", ")}
													</p>
												)}
											</div>
										)}
									</form.Field>

									{/* Email field */}
									<form.Field
										name="email"
										validators={{
											onChange: createZodValidator(emailSchema),
										}}
									>
										{(field) => (
											<div>
												<label
													className="block text-sm font-medium mb-2"
													htmlFor={field.name}
												>
													Email *
												</label>
												<input
													type="email"
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
														field.state.meta.errors.length > 0
															? "border-red-300 bg-red-50"
															: "border-gray-300"
													}`}
												/>
												{field.state.meta.errors.length > 0 && (
													<p className="text-red-600 text-sm mt-1">
														{field.state.meta.errors.join(", ")}
													</p>
												)}
											</div>
										)}
									</form.Field>
								</div>

								<div className="grid gap-6 md:grid-cols-2 mt-6">
									{/* Phone field */}
									<form.Field
										name="phone"
										validators={{
											onChange: createZodValidator(phoneSchema),
										}}
									>
										{(field) => (
											<div>
												<label
													className="block text-sm font-medium mb-2"
													htmlFor={field.name}
												>
													Telefon *
												</label>
												<input
													type="tel"
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
														field.state.meta.errors.length > 0
															? "border-red-300 bg-red-50"
															: "border-gray-300"
													}`}
												/>
												{field.state.meta.errors.length > 0 && (
													<p className="text-red-600 text-sm mt-1">
														{field.state.meta.errors.join(", ")}
													</p>
												)}
											</div>
										)}
									</form.Field>

									{/* Date field */}
									<form.Field
										name="date"
										validators={{
											onChange: createZodValidator(dateSchema),
										}}
									>
										{(field) => (
											<div>
												<label
													className="block text-sm font-medium mb-2"
													htmlFor={field.name}
												>
													Datum dodání *
												</label>
												<input
													type="date"
													id={field.name}
													name={field.name}
													value={field.state.value}
													min={defaultDate}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
														field.state.meta.errors.length > 0
															? "border-red-300 bg-red-50"
															: "border-gray-300"
													}`}
												/>
												<p className="text-sm text-gray-500 mt-1">
													Objednávky přijímáme minimálně 7 dní předem
												</p>
												{field.state.meta.errors.length > 0 && (
													<p className="text-red-600 text-sm mt-1">
														{field.state.meta.errors.join(", ")}
													</p>
												)}
											</div>
										)}
									</form.Field>
								</div>
							</div>

							{/* Order type selection section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Výběr objednávky
								</h2>

								<div className="mb-4">
									<fieldset>
										<legend className="block text-sm font-medium mb-2">
											Co si přejete objednat? *
										</legend>
										<div className="flex space-x-6">
											{/* Cake checkbox */}
											<form.Field name="orderCake">
												{(field) => (
													<label className="inline-flex items-center cursor-pointer">
														<input
															type="checkbox"
															checked={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.checked)
															}
															className="form-checkbox h-5 w-5 text-pink-500"
														/>
														<span className="ml-2 text-lg">Dort</span>
													</label>
												)}
											</form.Field>

											{/* Dessert checkbox */}
											<form.Field name="orderDessert">
												{(field) => (
													<label className="inline-flex items-center cursor-pointer">
														<input
															type="checkbox"
															checked={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.checked)
															}
															className="form-checkbox h-5 w-5 text-pink-500"
														/>
														<span className="ml-2 text-lg">Dezert</span>
													</label>
												)}
											</form.Field>
										</div>
									</fieldset>
								</div>

								{/* Cake form section */}
								<form.Field name="orderCake">
									{(cakeField) => (
										<div
											className={`bg-pink-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${
												cakeField.state.value
													? "opacity-100"
													: "hidden opacity-0"
											}`}
										>
											<h3 className="font-medium text-pink-800 mb-3">
												Parametry dortu
											</h3>
											<div className="grid gap-6 md:grid-cols-2">
												{/* Size field */}
												<form.Field
													name="size"
													validators={{
														onChange: createConditionalValidator(
															() => cakeField.state.value,
															(value: string) => {
																if (!value || value.trim() === "") {
																	return "Počet porcí je povinný při objednávce dortu";
																}
																return undefined;
															},
														),
													}}
												>
													{(field) => (
														<div>
															<label
																className="block text-sm font-medium mb-2"
																htmlFor={field.name}
															>
																Počet porcí{cakeField.state.value ? " *" : ""}
															</label>
															<input
																type="text"
																id={field.name}
																name={field.name}
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(e) =>
																	field.handleChange(e.target.value)
																}
																className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
																	field.state.meta.errors.length > 0
																		? "border-red-300 bg-red-50"
																		: "border-gray-300"
																}`}
															/>
															{field.state.meta.errors.length > 0 && (
																<p className="text-red-600 text-sm mt-1">
																	{field.state.meta.errors.join(", ")}
																</p>
															)}
														</div>
													)}
												</form.Field>

												{/* Flavor field */}
												<form.Field
													name="flavor"
													validators={{
														onChange: createConditionalValidator(
															() => cakeField.state.value,
															(value: string) => {
																if (!value || value.trim() === "") {
																	return "Příchuť je povinná při objednávce dortu";
																}
																return undefined;
															},
														),
													}}
												>
													{(field) => (
														<div>
															<label
																className="block text-sm font-medium mb-2"
																htmlFor={field.name}
															>
																Vybraná příchuť
																{cakeField.state.value ? " *" : ""}
															</label>
															<input
																type="text"
																id={field.name}
																name={field.name}
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(e) =>
																	field.handleChange(e.target.value)
																}
																className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
																	field.state.meta.errors.length > 0
																		? "border-red-300 bg-red-50"
																		: "border-gray-300"
																}`}
															/>
															{field.state.meta.errors.length > 0 && (
																<p className="text-red-600 text-sm mt-1">
																	{field.state.meta.errors.join(", ")}
																</p>
															)}
														</div>
													)}
												</form.Field>
											</div>
										</div>
									)}
								</form.Field>

								{/* Dessert form section */}
								<form.Field name="orderDessert">
									{(dessertField) => (
										<div
											className={`bg-blue-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${
												dessertField.state.value
													? "opacity-100"
													: "hidden opacity-0"
											}`}
										>
											<h3 className="font-medium text-blue-800 mb-3">
												Parametry dezertů
											</h3>
											<form.Field
												name="dessertChoice"
												validators={{
													onChange: createConditionalValidator(
														() => dessertField.state.value,
														(value: string) => {
															if (!value || value.trim() === "") {
																return "Výběr dezertů je povinný při objednávce dezertů";
															}
															return undefined;
														},
													),
												}}
											>
												{(field) => (
													<div>
														<label
															className="block text-sm font-medium mb-2"
															htmlFor={field.name}
														>
															Výběr dezertů
															{dessertField.state.value ? " *" : ""}
														</label>
														<textarea
															id={field.name}
															name={field.name}
															rows={3}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="Uveďte prosím dezerty, o které máte zájem, včetně množství a příchuti (např. 12x karamelový větrník)"
															className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
																field.state.meta.errors.length > 0
																	? "border-red-300 bg-red-50"
																	: "border-gray-300"
															}`}
														/>
														{field.state.meta.errors.length > 0 && (
															<p className="text-red-600 text-sm mt-1">
																{field.state.meta.errors.join(", ")}
															</p>
														)}
													</div>
												)}
											</form.Field>
										</div>
									)}
								</form.Field>
							</div>

							{/* Additional information section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Doplňující informace
								</h2>

								{/* Cake-specific section - only visible when cake is selected */}
								<form.Field name="orderCake">
									{(cakeField) => (
										<>
											{cakeField.state.value && (
												<div className="transition-opacity duration-300 ease-in-out">
													{/* Message field */}
													<form.Field name="message">
														{(field) => (
															<div className="mb-6">
																<label
																	className="block text-sm font-medium mb-2"
																	htmlFor={field.name}
																>
																	Vaše představa dortu
																</label>
																<textarea
																	id={field.name}
																	name={field.name}
																	rows={4}
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																	className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
																/>
															</div>
														)}
													</form.Field>

													{/* Photos field */}
													<form.Field name="photos">
														{(field) => (
															<div>
																<label
																	className="block text-sm font-medium mb-2"
																	htmlFor={field.name}
																>
																	Fotografie pro inspiraci (můžete nahrát více
																	fotografií)
																</label>
																<div className="relative">
																	<input
																		type="file"
																		id={field.name}
																		name={field.name}
																		accept="image/*"
																		multiple
																		onChange={(e) =>
																			field.handleChange(e.target.files)
																		}
																		className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
																	/>
																	<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-5 w-5 inline-block mr-1"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																			aria-hidden="true"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth="2"
																				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																			/>
																		</svg>
																		<span className="text-sm">
																			Vyberte více souborů
																		</span>
																	</div>
																</div>
																<p className="text-sm text-gray-500 mt-1">
																	Můžete nahrát více fotografií pro lepší
																	představu o vašem vysněném dortu (držte Ctrl
																	nebo Cmd pro výběr více souborů)
																</p>
																<p className="text-sm text-gray-500 mt-1">
																	Podporované formáty: JPG, PNG, GIF, WEBP.
																	Maximální velikost: 1 MB na soubor.
																</p>
															</div>
														)}
													</form.Field>
												</div>
											)}

											{/* Info text for dessert-only orders */}
											{!cakeField.state.value && (
												<form.Field name="orderDessert">
													{(dessertField) => (
														<>
															{dessertField.state.value && (
																<div className="transition-opacity duration-300 ease-in-out">
																	<p className="text-center text-gray-500 italic py-4">
																		Pro objednávku dezertů nejsou potřeba další
																		informace.
																	</p>
																</div>
															)}
														</>
													)}
												</form.Field>
											)}
										</>
									)}
								</form.Field>
							</div>
						</div>

						<div className="text-center">
							<button
								type="submit"
								disabled={
									submitOrderMutation.isPending || !form.state.canSubmit
								}
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors relative disabled:opacity-50"
							>
								{submitOrderMutation.isPending ? (
									<span className="flex items-center justify-center">
										<svg
											className="animate-spin h-5 w-5 mr-2"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
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
