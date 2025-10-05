import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { addDays, format, isAfter, parseISO, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
	type SubmitHandler,
	useForm as useReactHookForm,
} from "react-hook-form";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { getBlockedDates } from "../server/blocked-dates.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const blockedDates = await getBlockedDates();
	const blockedDateStrings = blockedDates.map((bd) => bd.date);

	return {
		blockedDates: blockedDateStrings,
	};
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
		deliveryDate: Date;
		cakeBoxQty: number;
		sweetbarBoxQty: number;
		totalAmount: number;
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

export default function ChristmasOrderForm() {
	const { blockedDates } = useLoaderData<typeof loader>();
	const [showBlockedDates, setShowBlockedDates] = useState(false);

	// Initialize default date (3 days from now)
	const today = startOfDay(new Date());
	const minDate = addDays(today, 3);
	const defaultDate = format(minDate, "yyyy-MM-dd", { locale: cs });

	// Get future blocked dates
	const futureBlockedDates = blockedDates.filter((dateStr) => {
		const date = parseISO(dateStr);
		return isAfter(date, today) || date.getTime() === today.getTime();
	});

	// Group consecutive dates into ranges
	const groupDateRanges = (dates: string[]) => {
		if (dates.length === 0) return [];

		const sortedDates = dates.sort((a, b) => a.localeCompare(b));
		const ranges: string[] = [];
		let rangeStart = sortedDates[0];
		let rangeEnd = sortedDates[0];

		for (let i = 1; i < sortedDates.length; i++) {
			const currentDate = parseISO(sortedDates[i]);
			const previousDate = parseISO(rangeEnd);
			const nextDay = addDays(previousDate, 1);

			if (currentDate.getTime() === nextDay.getTime()) {
				rangeEnd = sortedDates[i];
			} else {
				if (rangeStart === rangeEnd) {
					ranges.push(
						format(parseISO(rangeStart), "EEEE d. MMMM yyyy", { locale: cs }),
					);
				} else {
					ranges.push(
						`${format(parseISO(rangeStart), "EEEE d. MMMM", { locale: cs })} - ${format(parseISO(rangeEnd), "EEEE d. MMMM yyyy", { locale: cs })}`,
					);
				}
				rangeStart = sortedDates[i];
				rangeEnd = sortedDates[i];
			}
		}

		if (rangeStart === rangeEnd) {
			ranges.push(
				format(parseISO(rangeStart), "EEEE d. MMMM yyyy", { locale: cs }),
			);
		} else {
			ranges.push(
				`${format(parseISO(rangeStart), "EEEE d. MMMM", { locale: cs })} - ${format(parseISO(rangeEnd), "EEEE d. MMMM yyyy", { locale: cs })}`,
			);
		}

		return ranges;
	};

	// Hardcoded prices (matching backend)
	const CAKE_BOX_PRICE = 450;
	const SWEETBAR_BOX_PRICE = 350;

	const christmasFormSchema = z
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
				.refine(
					(date) => !blockedDates.includes(date),
					"Tento termín není dostupný",
				)
				.refine((date) => {
					const parsedDate = parseISO(date);
					const minDate = addDays(startOfDay(new Date()), 3);
					return (
						isAfter(parsedDate, minDate) ||
						parsedDate.getTime() === minDate.getTime()
					);
				}, "Datum vyzvednutí musí být alespoň 3 dny od dnes"),
			cakeBoxQty: z.number().int().min(0),
			sweetbarBoxQty: z.number().int().min(0),
			notes: z.string(),
		})
		.refine(
			(data) => {
				return data.cakeBoxQty > 0 || data.sweetbarBoxQty > 0;
			},
			{
				message:
					"Vyberte prosím alespoň jednu ochutnávkovou krabičku (dort nebo sweetbar)",
				path: ["cakeBoxQty"],
			},
		);

	type ChristmasFormData = z.infer<typeof christmasFormSchema>;

	const submitOrderMutation = useMutation({
		mutationFn: submitChristmasOrder,
	});

	// Scroll to top when the order is successfully submitted
	useEffect(() => {
		if (typeof window !== "undefined" && submitOrderMutation.isSuccess) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [submitOrderMutation.isSuccess]);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useReactHookForm<ChristmasFormData>({
		resolver: zodResolver(christmasFormSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			date: defaultDate,
			cakeBoxQty: 0,
			sweetbarBoxQty: 0,
			notes: "",
		},
	});

	const cakeBoxQty = watch("cakeBoxQty");
	const sweetbarBoxQty = watch("sweetbarBoxQty");

	const totalAmount =
		Number(cakeBoxQty || 0) * CAKE_BOX_PRICE +
		Number(sweetbarBoxQty || 0) * SWEETBAR_BOX_PRICE;

	const onSubmit: SubmitHandler<ChristmasFormData> = async (value) => {
		const formData = new FormData();

		for (const [key, val] of Object.entries(value)) {
			if (val !== null && val !== undefined) {
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
							🎄 Vánoční Ochutnávka
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

							{orderDetails && (
								<div className="bg-blue-50 rounded-lg p-6 mb-8">
									<h3 className="text-xl font-semibold mb-4">
										Platební instrukce
									</h3>
									<p className="text-gray-700 mb-4">
										Pro dokončení objednávky prosím uhraďte částku{" "}
										<strong className="text-2xl text-blue-800">
											{orderDetails.totalAmount} Kč
										</strong>
									</p>

									<div className="bg-white rounded-lg p-4 inline-block mb-4">
										<p className="text-sm text-gray-600 mb-2">
											Naskenujte QR kód ve vaší bankovní aplikaci
										</p>
										<div className="w-64 h-64 bg-gray-200 flex items-center justify-center mx-auto">
											<p className="text-gray-500 text-sm text-center px-4">
												QR kód bude přidán později
												<br />
												(placeholder)
											</p>
										</div>
									</div>

									<p className="text-sm text-gray-600">
										Po obdržení platby vám zašleme finální potvrzení
									</p>
								</div>
							)}

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
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-4 mt-12">
						🎄 Vánoční Ochutnávka
					</h1>
					<p className="text-center text-gray-600 mb-8">
						Objednejte si naše speciální vánoční ochutnávkové krabičky
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

									<div>
										<label
											className="block text-sm font-medium mb-2"
											htmlFor="date"
										>
											Datum vyzvednutí *
										</label>
										<input
											type="date"
											id="date"
											min={defaultDate}
											{...register("date", {
												onChange: (e) => {
													const selectedDate = e.target.value;
													if (blockedDates.includes(selectedDate)) {
														setShowBlockedDates(true);
													} else {
														setShowBlockedDates(false);
													}
												},
											})}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.date ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										<p className="text-sm text-gray-500 mt-1">
											Vyzvednutí minimálně 3 dny předem
										</p>
										{errors.date && (
											<p className="text-red-600 text-sm mt-1">
												{errors.date.message}
											</p>
										)}
										{(showBlockedDates ||
											errors.date?.message?.includes("není dostupný")) &&
											futureBlockedDates.length > 0 && (
												<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
													<p className="text-sm font-medium text-yellow-800 mb-2">
														Následující termíny nejsou dostupné:
													</p>
													<div className="text-sm text-yellow-700 space-y-1">
														{groupDateRanges(futureBlockedDates).map(
															(range) => (
																<div key={range}>• {range}</div>
															),
														)}
													</div>
												</div>
											)}
									</div>
								</div>
							</div>

							{/* Selection section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Výběr ochutnávkových krabiček
								</h2>

								<div className="space-y-4">
									<div className="bg-pink-50/50 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<label
												className="block text-sm font-medium"
												htmlFor="cakeBoxQty"
											>
												Ochutnávková krabička dortů
											</label>
											<span className="text-sm font-semibold text-pink-700">
												{CAKE_BOX_PRICE} Kč / kus
											</span>
										</div>
										<input
											type="number"
											id="cakeBoxQty"
											min="0"
											{...register("cakeBoxQty", { valueAsNumber: true })}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.cakeBoxQty ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
										{errors.cakeBoxQty && (
											<p className="text-red-600 text-sm mt-1">
												{errors.cakeBoxQty.message}
											</p>
										)}
									</div>

									<div className="bg-blue-50/50 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<label
												className="block text-sm font-medium"
												htmlFor="sweetbarBoxQty"
											>
												Ochutnávková krabička sweetbar
											</label>
											<span className="text-sm font-semibold text-blue-700">
												{SWEETBAR_BOX_PRICE} Kč / kus
											</span>
										</div>
										<input
											type="number"
											id="sweetbarBoxQty"
											min="0"
											{...register("sweetbarBoxQty", { valueAsNumber: true })}
											className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.sweetbarBoxQty ? "border-red-300 bg-red-50" : "border-gray-300"}`}
										/>
									</div>

									{totalAmount > 0 && (
										<div className="bg-green-50 rounded-lg p-4 border border-green-200">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-gray-700">
													Celková cena:
												</span>
												<span className="text-2xl font-bold text-green-700">
													{totalAmount} Kč
												</span>
											</div>
										</div>
									)}
								</div>

								<div className="mt-6">
									<label
										className="block text-sm font-medium mb-2"
										htmlFor="notes"
									>
										Poznámka (volitelné)
									</label>
									<textarea
										id="notes"
										rows={3}
										{...register("notes")}
										placeholder="Zde můžete uvést jakékoliv speciální požadavky..."
										className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						<div className="text-center">
							<button
								type="submit"
								disabled={isSubmitting || submitOrderMutation.isPending}
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors relative disabled:opacity-50"
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
