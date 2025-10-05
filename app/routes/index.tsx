import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

export default function Home() {
	const [currentSlide, setCurrentSlide] = useState(0);
	const sliderRef = useRef<HTMLDivElement>(null);
	const totalSlides = 5;

	// Update slider position
	const updateSlider = useCallback(() => {
		if (sliderRef.current) {
			sliderRef.current.style.transform = `translateX(-${currentSlide * 20}%)`;
		}
	}, [currentSlide]);

	// Auto advance slides
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % totalSlides);
		}, 4000);

		return () => clearInterval(interval);
	}, []);

	// Update slider when currentSlide changes
	useEffect(() => {
		updateSlider();
	}, [updateSlider]);

	// Intersection observer to reset slider when visible
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					setCurrentSlide(0);
				}
			}
		});

		if (sliderRef.current) {
			observer.observe(sliderRef.current);
		}

		return () => {
			if (sliderRef.current) {
				observer.unobserve(sliderRef.current);
			}
		};
	}, []);

	return (
		<div className="min-h-screen relative">
			<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
				<div className="bg-flowers h-full w-full -z-10" />
			</div>
			<div className="max-w-7xl mx-auto relative">
				<main
					className="flex items-center justify-center min-h-[50dvh] relative bg-white/50 backdrop-blur-sm py-12 md:py-16"
					id="top"
				>
					<div className="flex flex-col items-center justify-center text-center px-4 w-full">
						<p className="p-6 text-8xl liebe-erika mb-6 mt-8 md:mt-12">
							PANDÍ DORTY
						</p>
						<p className="text-lg md:text-xl max-w-2xl mx-auto mb-4">
							Jmenuji se Linh a sladké tvoření je moje vášeň. V mé malé
							cukrářské výrobně tvořím dorty a zákusky s důrazem na poctivou
							práci, kvalitní suroviny a hlavně na vaše přání. <br /> Ať už
							chystáte svatbu, narozeninovou oslavu nebo jen chcete někoho
							potěšit sladkým překvapením, ráda pro Vás vytvořím něco
							jedinečného. Moc si vážím každé objednávky a vždy se snažím, aby
							dort nejen krásně vypadal, ale hlavně skvěle chutnal. Stačí mi
							říct svou představu a společně vymyslíme sladké překvapení na
							míru.
						</p>
						<div className="mt-6 mb-8 flex flex-col sm:flex-row gap-4">
							<Link
								to="/objednavka"
								className="bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-900 transition-colors inline-block font-medium shadow-md"
							>
								Objednávkový formulář →
							</Link>
							<Link
								to="/vanocni-cukrovi"
								className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition-colors inline-block font-medium shadow-md"
							>
								🎄 Vánoční cukroví →
							</Link>
							<Link
								to="/svatebni-ochutnavka"
								className="bg-purple-700 text-white px-8 py-3 rounded-lg hover:bg-purple-800 transition-colors inline-block font-medium shadow-md"
							>
								💍 Svatební ochutnávka →
							</Link>
						</div>
					</div>
				</main>

				<section
					id="gallery-preview"
					className="max-w-4xl mx-auto px-4 md:px-6 mt-0 md:-mt-12 mb-12 relative z-10"
				>
					<a href="/gallery" className="block group">
						<div className="relative overflow-hidden rounded-2xl shadow-lg md:max-w-3xl lg:max-w-4xl mx-auto transition-transform duration-300 group-hover:scale-[1.02]">
							<div className="aspect-[3/2] md:aspect-[2/1]">
								<div
									ref={sliderRef}
									className="flex transition-transform duration-500 ease-in-out absolute inset-0 w-[500%]"
									id="slider"
								>
									<img
										src="/gallery/37.webp"
										alt="Ukázka dortu 1"
										className="w-[20%] h-full object-cover flex-shrink-0"
									/>
									<img
										src="/gallery/67.webp"
										alt="Ukázka dortu 2"
										className="w-[20%] h-full object-cover flex-shrink-0"
									/>
									<img
										src="/gallery/152.webp"
										alt="Ukázka dortu 3"
										className="w-[20%] h-full object-cover flex-shrink-0"
									/>
									<img
										src="/gallery/149.webp"
										alt="Ukázka dortu 4"
										className="w-[20%] h-full object-cover flex-shrink-0"
									/>
									<img
										src="/gallery/180.webp"
										alt="Ukázka dortu 5"
										className="w-[20%] h-full object-cover flex-shrink-0"
									/>
								</div>
							</div>
							<div className="absolute bottom-4 right-4 px-6 py-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg shadow-md transition-colors group-hover:bg-white">
								Zobrazit galerii →
							</div>
						</div>
					</a>
				</section>
			</div>
		</div>
	);
}
