import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import {
	type SubmitHandler,
	useForm as useReactHookForm,
} from "react-hook-form";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { WEDDING_TASTING_DATA } from "../data/wedding-tasting";

export async function loader() {
	const { getWeddingTastingCapacity } = await import(
		"../server/submit-wedding-tasting.server"
	);
	const capacity = await getWeddingTastingCapacity();
	return { capacity };
}

// Define schema for runtime validation
const weddingTastingResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	error: z.string().optional(),
	orderId: z.string().optional(),
	orderDetails: z
		.object({
			id: z.number(),
			orderNumber: z.string(),
			customerName: z.string(),
			cakeBox: z.boolean(),
			sweetbarBox: z.boolean(),
		})
		.optional(),
});

type WeddingTastingResponse = z.infer<typeof weddingTastingResponseSchema>;

const submitWeddingTasting = async (
	formData: FormData,
): Promise<WeddingTastingResponse> => {
	const response = await fetch("/api/submit-wedding-tasting", {
		method: "POST",
		body: formData,
	});

	const data = await response.json();

	// Validate response at runtime
	const validationResult = weddingTastingResponseSchema.safeParse(data);

	if (!validationResult.success) {
		console.error("Invalid API response:", validationResult.error);
		throw new Error("Neplatná odpověď ze serveru.");
	}

	const result = validationResult.data;

	if (!response.ok) {
		throw new Error(result.error || "Došlo k chybě při odesílání formuláře.");
	}

	return result;
};

const weddingTastingSchema = z
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
			.min(9, "Telefon musí mít alespoň 9 číslic")
			.regex(/^[0-9+\s()-]+$/, "Zadejte platné telefonní číslo"),
		cakeBox: z.boolean(),
		sweetbarBox: z.boolean(),
	})
	.refine(
		(data) => {
			return data.cakeBox || data.sweetbarBox;
		},
		{
			message:
				"Vyberte prosím alespoň jednu ochutnávkovou krabičku (dort nebo sweetbar)",
			path: ["cakeBox"],
		},
	);

type WeddingTastingFormData = z.infer<typeof weddingTastingSchema>;

export default function WeddingTastingForm() {
	const { capacity } = useLoaderData<typeof loader>();
	const nameId = useId();
	const emailId = useId();
	const phoneId = useId();
	const cakeBoxId = useId();
	const sweetbarBoxId = useId();

	const submitOrderMutation = useMutation({
		mutationFn: submitWeddingTasting,
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
		reset,
		formState: { errors, isSubmitting },
	} = useReactHookForm<WeddingTastingFormData>({
		resolver: zodResolver(weddingTastingSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			cakeBox: false,
			sweetbarBox: false,
		},
	});

	const onSubmit: SubmitHandler<WeddingTastingFormData> = async (value) => {
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
							Svatební Ochutnávka
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
								<p className="text-gray-600 mt-4">
									Brzy se Vám ozveme s dalšími informacemi.
								</p>
							</div>

							{/* QR Code Payment Section */}
							<div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
								<h3 className="text-xl font-semibold mb-4 text-gray-900">
									Platba zálohy
								</h3>
								<p className="text-gray-700 mb-4">
									Pro dokončení objednávky prosím uhraďte zálohu{" "}
									<strong>{WEDDING_TASTING_DATA.payment.deposit} Kč</strong>
								</p>
								<div className="flex justify-center mb-4">
									<img
										src={WEDDING_TASTING_DATA.payment.qrCodePath}
										alt="QR kód pro platbu"
										className="max-w-xs w-full border-2 border-gray-300 rounded-lg shadow-lg"
									/>
								</div>
								<p className="text-sm text-gray-600">
									Naskenujte QR kód pomocí bankovní aplikace pro rychlou platbu
								</p>
								<p className="text-sm text-red-600 mt-2 font-medium">
									{WEDDING_TASTING_DATA.payment.description}
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

			<div className="max-w-2xl mx-auto px-4 py-12">
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-8 mt-12">
						Svatební ochutnávky
					</h1>

					{/* Capacity indicator */}
					{capacity.isAvailable ? (
						<div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6 text-center">
							<p className="text-green-800">
								Zbývá <strong>{capacity.remaining}</strong> volných míst z
								celkové kapacity {capacity.max} objednávek
							</p>
						</div>
					) : (
						<div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 text-center">
							<p className="text-red-800 font-semibold">
								Omlouváme se, ale kapacita pro svatební ochutnávky je již
								naplněna
							</p>
							<p className="text-red-600 text-sm mt-2">
								Zkuste to prosím později nebo nás kontaktujte přímo
							</p>
						</div>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						{/* Form-level error */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg">
								{Object.values(errors)
									.map((err) => err?.message)
									.filter(Boolean)
									.join(", ")}
							</div>
						)}

						{/* TanStack Query mutation error */}
						{submitOrderMutation.error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg">
								{submitOrderMutation.error.message}
							</div>
						)}

						{/* Description section */}
						<div className="p-6 bg-pink-50 rounded-lg border border-pink-200 space-y-6">
							<p className="text-gray-700 leading-relaxed">
								Chystáte svatbu a chcete si být jisti, že dorty a zákusky budou
								přesně podle vašich představ? Objednejte si naši svatební
								ochutnávku!
							</p>

							<div className="space-y-4">
								<div className="bg-white/70 p-4 rounded-lg">
									<h3 className="font-semibold text-lg mb-2">
										{WEDDING_TASTING_DATA.cakeBox.name} -{" "}
										{WEDDING_TASTING_DATA.cakeBox.price} Kč
									</h3>
									<p className="text-sm text-gray-600 mb-2">
										{WEDDING_TASTING_DATA.cakeBox.description}:
									</p>
									<ul className="text-sm space-y-1">
										{WEDDING_TASTING_DATA.cakeBox.items.map((item) => (
											<li key={item} className="ml-4">
												* {item}
											</li>
										))}
									</ul>
								</div>

								<div className="bg-white/70 p-4 rounded-lg">
									<h3 className="font-semibold text-lg mb-2">
										{WEDDING_TASTING_DATA.sweetbarBox.name} -{" "}
										{WEDDING_TASTING_DATA.sweetbarBox.price} Kč
									</h3>
									<p className="text-sm text-gray-600 mb-2">
										{WEDDING_TASTING_DATA.sweetbarBox.description}:
									</p>
									<ul className="text-sm space-y-1">
										{WEDDING_TASTING_DATA.sweetbarBox.items.map((item) => (
											<li key={item} className="ml-4">
												* {item}
											</li>
										))}
									</ul>
								</div>
							</div>

							<div className="border-t pt-4 space-y-2 text-sm">
								<p className="text-gray-700">
									Objednávky přijímáme pouze přes webové stránky{" "}
									{WEDDING_TASTING_DATA.orderDeadline}
								</p>
								<p className="text-gray-700">
									Vyzvednutí proběhne {WEDDING_TASTING_DATA.pickup.date}{" "}
									{WEDDING_TASTING_DATA.pickup.time}{" "}
									{WEDDING_TASTING_DATA.pickup.location}
								</p>
								<p className="text-red-600 font-medium">
									{WEDDING_TASTING_DATA.payment.description}
								</p>
							</div>
						</div>

						{/* Contact information section */}
						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
								Kontaktní údaje
							</h2>

							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<label
										className="block text-sm font-medium mb-2"
										htmlFor={nameId}
									>
										Jméno a příjmení *
									</label>
									<input
										type="text"
										id={nameId}
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
										htmlFor={emailId}
									>
										E-mail *
									</label>
									<input
										type="email"
										id={emailId}
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

							<div>
								<label
									className="block text-sm font-medium mb-2"
									htmlFor={phoneId}
								>
									Telefon *
								</label>
								<input
									type="tel"
									id={phoneId}
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

						{/* Selection section */}
						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
								Výběr objednávky
							</h2>

							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<input
										type="checkbox"
										id={cakeBoxId}
										{...register("cakeBox")}
										className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
									/>
									<label htmlFor={cakeBoxId} className="text-base font-medium">
										{WEDDING_TASTING_DATA.cakeBox.name} (
										{WEDDING_TASTING_DATA.cakeBox.price} Kč)
									</label>
								</div>

								<div className="flex items-center gap-3">
									<input
										type="checkbox"
										id={sweetbarBoxId}
										{...register("sweetbarBox")}
										className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
									/>
									<label
										htmlFor={sweetbarBoxId}
										className="text-base font-medium"
									>
										{WEDDING_TASTING_DATA.sweetbarBox.name} (
										{WEDDING_TASTING_DATA.sweetbarBox.price} Kč)
									</label>
								</div>

								{errors.cakeBox && (
									<p className="text-red-600 text-sm">
										{errors.cakeBox.message}
									</p>
								)}
							</div>
						</div>

						{/* Submit button */}
						<div className="text-center pt-4">
							<button
								type="submit"
								disabled={
									!capacity.isAvailable ||
									isSubmitting ||
									submitOrderMutation.isPending
								}
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors relative disabled:opacity-50 font-medium"
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
								) : !capacity.isAvailable ? (
									<span>Kapacita naplněna</span>
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
