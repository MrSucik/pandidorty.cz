import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	type SubmitHandler,
	useForm as useReactHookForm,
} from "react-hook-form";
import { z } from "zod";
import {
	CHRISTMAS_ORDER_CONFIG,
	CHRISTMAS_SWEETS_OPTIONS,
} from "../data/christmas-sweets";
import { FEATURE_CHRISTMAS_ORDER } from "../config/features";

export async function loader() {
	// Return 404 if the feature is disabled
	if (!FEATURE_CHRISTMAS_ORDER) {
		throw new Response(null, { status: 404, statusText: "Not Found" });
	}

	return {};
}

interface ChristmasOrderResponse {
	success: boolean;
	message?: string;
	error?: string;
	orderId?: string;
	orderDetails?: {
		id: number;
		orderNumber: string;
		customerName: string;
		orderItems: Array<{
			sweetId: string;
			name: string;
			quantity: number; // in 100g units
			pricePerUnit: number;
			totalPrice: number;
		}>;
		totalAmount: number;
		totalWeight: number; // in grams
	};
}

const submitChristmasOrder = async (
	formData: FormData,
): Promise<ChristmasOrderResponse> => {
	const response = await fetch("/api/submit-christmas-order", {
		method: "POST",
		body: formData,
	});

	const result = (await response.json()) as ChristmasOrderResponse;

	if (!response.ok) {
		throw new Error(result.error || "Došlo k chybě při odesílání formuláře.");
	}

	return result;
};

// Create dynamic schema for candy quantities
const createChristmasFormSchema = () => {
	// Create an object with all candy IDs as keys with number validation
	const candyQuantities: Record<string, z.ZodTypeAny> = {};
	for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
		candyQuantities[`quantity_${sweet.id}`] = z
			.number()
			.int()
			.min(0)
			.default(0);
	}

	return z
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
			...candyQuantities,
		})
		.refine(
			(data) => {
				// Check if at least one candy has quantity > 0
				return CHRISTMAS_SWEETS_OPTIONS.some(
					(sweet) => (data as any)[`quantity_${sweet.id}`] > 0,
				);
			},
			{
				message: "Vyberte alespoň jeden druh cukroví",
			},
		)
		.refine(
			(data) => {
				// Calculate total order amount
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
};

type ChristmasFormData = z.infer<ReturnType<typeof createChristmasFormSchema>>;

export default function ChristmasOrderForm() {
	const submitOrderMutation = useMutation({
		mutationFn: submitChristmasOrder,
	});

	const christmasFormSchema = createChristmasFormSchema();

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useReactHookForm<ChristmasFormData>({
		resolver: zodResolver(christmasFormSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			...Object.fromEntries(
				CHRISTMAS_SWEETS_OPTIONS.map((sweet) => [`quantity_${sweet.id}`, 0]),
			),
		},
	});

	// Watch all quantity fields to calculate total
	const quantities = watch();

	// Calculate total price
	const totalAmount = CHRISTMAS_SWEETS_OPTIONS.reduce((total, sweet) => {
		const quantity = (quantities as any)[`quantity_${sweet.id}`] || 0;
		return total + quantity * sweet.pricePer100g;
	}, 0);

	// Get ordered items for display
	const orderedItems = CHRISTMAS_SWEETS_OPTIONS.filter(
		(sweet) => (quantities as any)[`quantity_${sweet.id}`] > 0,
	).map((sweet) => ({
		...sweet,
		quantity: (quantities as any)[`quantity_${sweet.id}`],
		subtotal: (quantities as any)[`quantity_${sweet.id}`] * sweet.pricePer100g,
	}));

	// Scroll to top when the order is successfully submitted
	useEffect(() => {
		if (typeof window !== "undefined" && submitOrderMutation.isSuccess) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [submitOrderMutation.isSuccess]);

	const onSubmit: SubmitHandler<ChristmasFormData> = async (value) => {
		const formData = new FormData();

		// Add basic fields
		formData.append("name", value.name);
		formData.append("email", value.email);
		formData.append("phone", value.phone);

		// Add selected sweets and quantities
		const selectedSweets: string[] = [];
		for (const sweet of CHRISTMAS_SWEETS_OPTIONS) {
			const quantity = (value as any)[`quantity_${sweet.id}`];
			if (quantity > 0) {
				selectedSweets.push(sweet.id);
				formData.append(`quantity_${sweet.id}`, quantity.toString());
			}
		}

		// Add selected sweets array
		for (const sweetId of selectedSweets) {
			formData.append("selectedSweets", sweetId);
		}

		submitOrderMutation.mutate(formData, {
			onSuccess: () => {
				reset();
			},
		});
	};

	// Success state UI
	if (submitOrderMutation.isSuccess && submitOrderMutation.data) {
		const orderDetails = submitOrderMutation.data.orderDetails;

		return (
			<div className="min-h-screen relative">
				<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
					<div className="bg-flowers h-full w-full -z-10" />
				</div>

				<div className="max-w-4xl mx-auto px-4 py-12">
					<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
						<h1 className="text-3xl md:text-4xl font-bold text-center mb-8 mt-12">
							🎄 Vánoční Cukroví
						</h1>

						<div className="text-center p-8">
							<div className="mb-8">
								<h2 className="text-2xl font-semibold text-green-600 mb-4">
									{submitOrderMutation.data?.message ||
										"Objednávka byla úspěšně odeslána!"}
								</h2>
								<p className="text-lg text-gray-700 mb-2">
									Číslo objednávky: <strong>{orderDetails?.orderNumber}</strong>
								</p>
							</div>

							{orderDetails?.orderItems && (
								<div className="bg-green-50 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
									<h3 className="text-lg font-semibold mb-4">
										Shrnutí objednávky:
									</h3>
									<div className="space-y-2">
										{orderDetails.orderItems.map((item) => (
											<div
												key={item.sweetId}
												className="flex justify-between text-sm"
											>
												<span>
													{item.name} ({item.quantity * 100}g)
												</span>
												<span className="font-medium">
													{item.totalPrice} Kč
												</span>
											</div>
										))}
									</div>
									<div className="border-t mt-4 pt-4">
										<div className="flex justify-between font-semibold text-lg">
											<span>Celková cena:</span>
											<span className="text-green-700">
												{orderDetails.totalAmount} Kč
											</span>
										</div>
									</div>
								</div>
							)}

							{/* QR Code Payment Section */}
							<div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
								<h3 className="text-xl font-semibold mb-4 text-gray-900">
									💳 Platba zálohy
								</h3>
								<p className="text-gray-700 mb-4">
									Pro dokončení objednávky prosím uhraďte{" "}
									{orderDetails?.totalAmount &&
									orderDetails.totalAmount < CHRISTMAS_ORDER_CONFIG.deposit
										? "částku"
										: "zálohu"}{" "}
									<strong className="text-2xl text-blue-800">
										{orderDetails?.totalAmount &&
										orderDetails.totalAmount < CHRISTMAS_ORDER_CONFIG.deposit
											? orderDetails.totalAmount
											: CHRISTMAS_ORDER_CONFIG.deposit}{" "}
										Kč
									</strong>
								</p>
								{orderDetails?.totalAmount &&
									orderDetails.totalAmount > CHRISTMAS_ORDER_CONFIG.deposit && (
										<p className="text-sm text-gray-600 mb-4">
											Doplatek{" "}
											{orderDetails.totalAmount -
												CHRISTMAS_ORDER_CONFIG.deposit}{" "}
											Kč uhradíte při vyzvednutí.
										</p>
									)}

								<div className="bg-white rounded-lg p-4 inline-block mb-4">
									<p className="text-sm text-gray-600 mb-2">
										Naskenujte QR kód ve vaší bankovní aplikaci
									</p>
									<div className="flex justify-center mb-4">
										<img
											src={CHRISTMAS_ORDER_CONFIG.qrCodePath}
											alt="QR kód pro platbu"
											className="max-w-xs w-full border-2 border-gray-300 rounded-lg shadow-lg"
										/>
									</div>
								</div>

								<p className="text-sm text-gray-600">
									{CHRISTMAS_ORDER_CONFIG.description}
								</p>
								<p className="text-sm text-gray-600">
									{orderDetails?.totalAmount && orderDetails.totalAmount < CHRISTMAS_ORDER_CONFIG.deposit
										? "Po obdržení platby vám zašleme finální potvrzení."
										: "Po obdržení zálohy vám zašleme finální potvrzení."}
								</p>
							</div>

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

			<div className="max-w-6xl mx-auto px-4 py-12">
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-4 mt-12">
						🎄 Vánoční Cukroví
					</h1>
					<p className="text-center text-gray-600 mb-8">
						Vyberte si z naší nabídky vánočního cukroví
					</p>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{/* Form-level error */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
								{Object.values(errors)
									.map((err) => err?.message)
									.filter(Boolean)
									.join(", ")}
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
									<div>
										<label
											className="block text-sm font-medium mb-2"
											htmlFor="name"
										>
											Jméno a příjmení *
										</label>
										<input
											type="text"
											id="name"
											{...register("name")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.name ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.name && (
											<p className="text-red-600 text-sm mt-1">
												{errors.name.message}
											</p>
										)}
									</div>

									<div>
										<label
											className="block text-sm font-medium mb-2"
											htmlFor="email"
										>
											Email *
										</label>
										<input
											type="email"
											id="email"
											{...register("email")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.email ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.email && (
											<p className="text-red-600 text-sm mt-1">
												{errors.email.message}
											</p>
										)}
									</div>
								</div>

								<div className="grid gap-6 md:grid-cols-2 mt-6">
									<div>
										<label
											className="block text-sm font-medium mb-2"
											htmlFor="phone"
										>
											Telefon *
										</label>
										<input
											type="tel"
											id="phone"
											{...register("phone")}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.phone && (
											<p className="text-red-600 text-sm mt-1">
												{errors.phone.message}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Candy selection section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Výběr cukroví
								</h2>
								<p className="text-sm text-gray-600 mb-4">
									Vyberte druhy a množství cukroví (po 100g)
								</p>

								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{CHRISTMAS_SWEETS_OPTIONS.map((sweet) => {
										const quantity =
											(quantities as any)[`quantity_${sweet.id}`] || 0;
										const subtotal = quantity * sweet.pricePer100g;

										return (
											<div
												key={sweet.id}
												className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-pink-300 transition-colors shadow-sm"
											>
												{sweet.imagePath && (
													<div className="aspect-[4/3] w-full overflow-hidden">
														<img
															src={sweet.imagePath}
															alt={sweet.name}
															className="w-full h-full object-cover"
														/>
													</div>
												)}
												<div className="p-4">
													<h3 className="font-semibold text-sm mb-1">
														{sweet.name}
													</h3>
													<p className="text-xs text-gray-500 mb-3">
														{sweet.pricePer100g} Kč / 100g • ~
														{sweet.approxPiecesPer100g} ks
													</p>
													<div className="flex flex-col gap-2">
														<div className="flex items-center gap-2">
															<label className="text-xs text-gray-600 whitespace-nowrap">
																Množství (×100g):
															</label>
															<input
																type="number"
																min="0"
																max="50"
																step="1"
																{...register(`quantity_${sweet.id}` as any, {
																	valueAsNumber: true,
																})}
																className="w-20 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-pink-500"
															/>
														</div>
														{quantity > 0 && (
															<div className="text-xs font-medium text-green-600 text-center bg-green-50 py-1 rounded">
																= {subtotal} Kč
															</div>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Order summary */}
							{orderedItems.length > 0 && (
								<div className="bg-green-50 rounded-lg p-5 border border-green-200">
									<h3 className="text-lg font-semibold mb-3">
										Shrnutí objednávky:
									</h3>
									<div className="space-y-2">
										{orderedItems.map((item) => (
											<div
												key={item.id}
												className="flex justify-between text-sm"
											>
												<span>
													{item.name} ({item.quantity * 100}g)
												</span>
												<span className="font-medium">{item.subtotal} Kč</span>
											</div>
										))}
									</div>
									<div className="border-t border-green-200 mt-3 pt-3">
										<div className="flex justify-between font-bold text-lg">
											<span>Celková cena:</span>
											<span className="text-green-700">{totalAmount} Kč</span>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Submit button */}
						<div className="text-center pt-4">
							<button
								type="submit"
								disabled={
									isSubmitting ||
									submitOrderMutation.isPending ||
									totalAmount === 0
								}
								className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition-colors relative disabled:opacity-50 font-medium"
							>
								{submitOrderMutation.isPending || isSubmitting ? (
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
