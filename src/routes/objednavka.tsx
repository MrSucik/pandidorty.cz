import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { addDays, format } from "date-fns";

export const Route = createFileRoute("/objednavka")({
	component: OrderForm,
});

function OrderForm() {
	// Initialize the default date
	const today = new Date();
	const minDate = addDays(today, 7);
	const defaultDate = format(minDate, "yyyy-MM-dd");

	// Form state
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isCakeSelected, setIsCakeSelected] = useState(true);
	const [isDessertSelected, setIsDessertSelected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formResult, setFormResult] = useState<{
		success?: boolean;
		message?: string;
		error?: string;
	} | null>(null);

	// Get form result from URL params on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const formResultParam = urlParams.get("formResult");
		if (formResultParam) {
			try {
				const result = JSON.parse(formResultParam);
				setFormResult(result);
			} catch (e) {
				console.error("Failed to parse form result:", e);
			}
		}
	}, []);

	const handleCakeCheckboxChange = useCallback((checked: boolean) => {
		setIsCakeSelected(checked);
	}, []);

	const handleDessertCheckboxChange = useCallback((checked: boolean) => {
		setIsDessertSelected(checked);
	}, []);

	const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		// Check if at least one option is selected
		if (!isCakeSelected && !isDessertSelected) {
			alert("Vyberte prosím alespoň jednu možnost: Dort nebo Dezert");
			return;
		}
		
		setIsLoading(true);

		try {
			const formData = new FormData(e.currentTarget);
			const response = await fetch("/api/submit-order", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			// Redirect with result
			const url = new URL(window.location.href);
			url.searchParams.set("formResult", JSON.stringify(result));
			window.location.href = url.toString();
		} catch (error) {
			console.error("Form submission error:", error);
			const url = new URL(window.location.href);
			url.searchParams.set(
				"formResult",
				JSON.stringify({
					success: false,
					error: "Došlo k chybě při odesílání formuláře. Zkuste to prosím později.",
				})
			);
			window.location.href = url.toString();
		}
	}, [isCakeSelected, isDessertSelected]);

	// Show success message if form was submitted successfully
	if (formResult?.success) {
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
								{formResult.message}
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
						onSubmit={handleFormSubmit}
						className="space-y-6"
						encType="multipart/form-data"
					>
						{formResult?.error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
								{formResult.error}
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
										<label className="block text-sm font-medium mb-2" htmlFor="name">
											Jméno a příjmení *
										</label>
										<input
											type="text"
											id="name"
											name="name"
											required
											minLength={2}
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="email">
											Email *
										</label>
										<input
											type="email"
											id="email"
											name="email"
											required
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
										/>
									</div>
								</div>

								<div className="grid gap-6 md:grid-cols-2 mt-6">
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="phone">
											Telefon *
										</label>
										<input
											type="tel"
											id="phone"
											name="phone"
											required
											minLength={9}
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="date">
											Datum dodání *
										</label>
										<input
											type="date"
											id="date"
											name="date"
											required
											min={defaultDate}
											defaultValue={defaultDate}
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
										/>
										<p className="text-sm text-gray-500 mt-1">
											Objednávky přijímáme minimálně 7 dní předem
										</p>
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
										<legend className="block text-sm font-medium mb-2">
											Co si přejete objednat? *
										</legend>
									<div className="flex space-x-6">
										<label className="inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												name="orderCake"
												value="true"
												checked={isCakeSelected}
												onChange={(e) => handleCakeCheckboxChange(e.target.checked)}
												className="form-checkbox h-5 w-5 text-pink-500"
											/>
											<span className="ml-2 text-lg">Dort</span>
										</label>
										<label className="inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												name="orderDessert"
												value="true"
												checked={isDessertSelected}
												onChange={(e) => handleDessertCheckboxChange(e.target.checked)}
												className="form-checkbox h-5 w-5 text-pink-500"
											/>
											<span className="ml-2 text-lg">Dezert</span>
										</label>
									</div>
									</fieldset>
								</div>

								{/* Cake form section */}
								<div
									className={`bg-pink-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${
										isCakeSelected ? "opacity-100" : "hidden opacity-0"
									}`}
								>
									<h3 className="font-medium text-pink-800 mb-3">Parametry dortu</h3>
									<div className="grid gap-6 md:grid-cols-2">
										<div>
											<label className="block text-sm font-medium mb-2" htmlFor="size">
												Počet porcí{isCakeSelected ? " *" : ""}
											</label>
											<input
												type="text"
												id="size"
												name="size"
												required={isCakeSelected}
												className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-2" htmlFor="flavor">
												Vybraná příchuť{isCakeSelected ? " *" : ""}
											</label>
											<input
												type="text"
												id="flavor"
												name="flavor"
												required={isCakeSelected}
												className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
											/>
										</div>
									</div>
								</div>

								{/* Dessert form section */}
								<div
									className={`bg-blue-50/50 rounded-lg p-4 mb-6 transition-opacity duration-300 ease-in-out ${
										isDessertSelected ? "opacity-100" : "hidden opacity-0"
									}`}
								>
									<h3 className="font-medium text-blue-800 mb-3">Parametry dezertů</h3>
									<div>
										<label className="block text-sm font-medium mb-2" htmlFor="dessertChoice">
											Výběr dezertů{isDessertSelected ? " *" : ""}
										</label>
										<textarea
											id="dessertChoice"
											name="dessertChoice"
											rows={3}
											required={isDessertSelected}
											placeholder="Uveďte prosím dezerty, o které máte zájem, včetně množství a příchuti (např. 12x karamelový větrník)"
											className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
										/>
									</div>
								</div>
							</div>

							{/* Additional information section */}
							<div className="bg-white/80 rounded-lg p-5 border border-gray-100 shadow-sm">
								<h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">
									Doplňující informace
								</h2>

								{/* Cake-specific section - only visible when cake is selected */}
								{isCakeSelected && (
									<div className="transition-opacity duration-300 ease-in-out">
										<div className="mb-6">
											<label className="block text-sm font-medium mb-2" htmlFor="message">
												Vaše představa dortu
											</label>
											<textarea
												id="message"
												name="message"
												rows={4}
												className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2" htmlFor="photos">
												Fotografie pro inspiraci (můžete nahrát více fotografií)
											</label>
											<div className="relative">
												<input
													type="file"
													id="photos"
													name="photos"
													accept="image/*"
													multiple
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
													<span className="text-sm">Vyberte více souborů</span>
												</div>
											</div>
											<p className="text-sm text-gray-500 mt-1">
												Můžete nahrát více fotografií pro lepší představu o vašem vysněném dortu (držte Ctrl nebo Cmd pro výběr více souborů)
											</p>
											<p className="text-sm text-gray-500 mt-1">
												Podporované formáty: JPG, PNG, GIF, WEBP. Maximální velikost: 1 MB na soubor.
											</p>
										</div>
									</div>
								)}

								{/* Info text for dessert-only orders */}
								{isDessertSelected && !isCakeSelected && (
									<div className="transition-opacity duration-300 ease-in-out">
										<p className="text-center text-gray-500 italic py-4">
											Pro objednávku dezertů nejsou potřeba další informace.
										</p>
									</div>
								)}
							</div>
						</div>

						{formResult?.error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-lg">
								{formResult.error}
							</div>
						)}

						<div className="text-center">
							<button
								type="submit"
								disabled={isLoading}
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors relative disabled:opacity-50"
							>
								{isLoading ? (
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