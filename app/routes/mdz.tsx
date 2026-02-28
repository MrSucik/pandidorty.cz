import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import {
	type SubmitHandler,
	useForm as useReactHookForm,
} from "react-hook-form";
import { z } from "zod";
import { MDZ_DATA } from "../data/mdz";

const mdzResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	error: z.string().optional(),
	orderId: z.string().optional(),
	orderDetails: z
		.object({
			id: z.number(),
			orderNumber: z.string(),
			customerName: z.string(),
			productChoice: z.string(),
			price: z.number(),
		})
		.optional(),
});

type MdzResponse = z.infer<typeof mdzResponseSchema>;

async function submitMdzOrder(
	formData: FormData,
): Promise<MdzResponse> {
	const response = await fetch("/api/submit-mdz", {
		method: "POST",
		body: formData,
	});

	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error(
			"Server neodpověděl správně. Zkuste to prosím znovu nebo nás kontaktujte.",
		);
	}

	if (!response.ok) {
		const errorMessage =
			typeof data === "object" && data !== null && "error" in data
				? String((data as Record<string, unknown>).error)
				: "Došlo k chybě při odesílání formuláře.";
		throw new Error(errorMessage);
	}

	const validationResult = mdzResponseSchema.safeParse(data);

	if (!validationResult.success) {
		console.error("Invalid API response:", validationResult.error);
		throw new Error("Neplatná odpověď ze serveru.");
	}

	return validationResult.data;
}

const mdzFormSchema = z.object({
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
	productChoice: z.enum(["withFlowers", "dessertsOnly"], {
		message: "Vyberte prosím jednu z možností",
	}),
});

type MdzFormData = z.infer<typeof mdzFormSchema>;

export default function MdzForm() {
	const nameId = useId();
	const emailId = useId();
	const phoneId = useId();
	const withFlowersId = useId();
	const dessertsOnlyId = useId();

	const submitOrderMutation = useMutation({
		mutationFn: submitMdzOrder,
	});

	useEffect(() => {
		if (submitOrderMutation.isSuccess) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [submitOrderMutation.isSuccess]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useReactHookForm<MdzFormData>({
		resolver: zodResolver(mdzFormSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: {
			name: "",
			email: "",
			phone: "",
		},
	});

	const onSubmit: SubmitHandler<MdzFormData> = async (value) => {
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
							MDŽ nabídka
						</h1>

						<div className="text-center p-8">
							<div className="mb-8">
								<h2 className="text-2xl font-semibold text-green-600 mb-4">
									{submitOrderMutation.data.message ||
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
									<strong>{MDZ_DATA.payment.deposit} Kč</strong>
								</p>
								<div className="flex justify-center mb-4">
									<img
										src={MDZ_DATA.payment.qrCodePath}
										alt="QR kód pro platbu"
										className="max-w-xs w-full border-2 border-gray-300 rounded-lg shadow-lg"
									/>
								</div>
								<p className="text-sm text-gray-600">
									Naskenujte QR kód pomocí bankovní aplikace pro rychlou platbu
								</p>
								<p className="text-sm text-red-600 mt-2 font-medium">
									{MDZ_DATA.payment.description}
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
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-2 mt-12">
						MDŽ nabídka
					</h1>
					<p className="text-center text-pink-400 text-sm tracking-widest uppercase mb-8">
						Mezinárodní den žen 2026
					</p>

					{/* Product gallery */}
					<div className="mb-8 grid grid-cols-3 gap-2">
						<div className="col-span-2 overflow-hidden rounded-xl shadow-md">
							<img
								src="/mdz/set-with-flowers.webp"
								alt="Speciální set zákusků s kytice od Nedbalek"
								className="w-full h-full object-cover"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<div className="overflow-hidden rounded-xl shadow-md flex-1">
								<img
									src="/mdz/desserts.webp"
									alt="XXL tartaletka a čokoládový větrník"
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="overflow-hidden rounded-xl shadow-md flex-1">
								<img
									src="/mdz/team.webp"
									alt="Pandí Dorty a Nedbalky"
									className="w-full h-full object-cover"
								/>
							</div>
						</div>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg">
								{Object.values(errors)
									.map((err) => err?.message)
									.filter(Boolean)
									.join(", ")}
							</div>
						)}

						{submitOrderMutation.error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg">
								{submitOrderMutation.error.message}
							</div>
						)}

						<div className="p-6 bg-pink-50 rounded-lg border border-pink-200 space-y-6">
							<p className="text-gray-700 leading-relaxed">
								K příležitosti Mezinárodního dne žen jsme vytvořili speciální set
								složený ze dvou zákusků a krásné kytice od Nedbalek
							</p>

							<div className="bg-white/70 p-4 rounded-lg">
								<h3 className="font-semibold text-lg mb-2">
									V krabičce naleznete:
								</h3>
								<ul className="text-sm space-y-1">
									{MDZ_DATA.boxContents.map((item) => (
										<li key={item} className="ml-4">
											* {item}
										</li>
									))}
								</ul>
							</div>

							<div className="border-t pt-4 space-y-2 text-sm">
								<p className="text-gray-700">
									Objednávky přijímáme pouze přes webové stránky,
									a to {MDZ_DATA.orderDeadline}.
								</p>
								<p className="text-gray-700">
									Vyzvednutí proběhne {MDZ_DATA.pickupDate}:
								</p>
								<ul className="text-gray-700 ml-4 space-y-1">
									{MDZ_DATA.pickup.map((pickup) => (
										<li key={pickup.label}>
											{pickup.label}
											{"location" in pickup ? ` (${pickup.location})` : ""}
											: {pickup.time}
										</li>
									))}
								</ul>
								<p className="text-gray-600 italic">
									{MDZ_DATA.pickupNote}
								</p>
								<p className="text-red-600 font-medium mt-2">
									{MDZ_DATA.payment.description}
								</p>
							</div>

							<p className="text-gray-700 leading-relaxed">
								Protože tento den patří ženám, které si zaslouží pozornost
								i malé sladké potěšení, tak jim nezapomeňte udělat radost!
							</p>
						</div>

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

						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
								Výběr objednávky
							</h2>

							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<input
										type="radio"
										id={withFlowersId}
										value="withFlowers"
										{...register("productChoice")}
										className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500"
									/>
									<label htmlFor={withFlowersId} className="text-base font-medium">
										{MDZ_DATA.products.withFlowers.name} (
										{MDZ_DATA.products.withFlowers.price} Kč)
									</label>
								</div>

								<div className="flex items-center gap-3">
									<input
										type="radio"
										id={dessertsOnlyId}
										value="dessertsOnly"
										{...register("productChoice")}
										className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500"
									/>
									<label
										htmlFor={dessertsOnlyId}
										className="text-base font-medium"
									>
										{MDZ_DATA.products.dessertsOnly.name} (
										{MDZ_DATA.products.dessertsOnly.price} Kč)
									</label>
								</div>

								{errors.productChoice && (
									<p className="text-red-600 text-sm">
										{errors.productChoice.message}
									</p>
								)}
							</div>
						</div>

						<div className="text-center pt-4">
							<button
								type="submit"
								disabled={isSubmitting || submitOrderMutation.isPending}
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
