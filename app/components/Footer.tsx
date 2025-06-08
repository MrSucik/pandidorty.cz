import { useLocation } from "react-router";

interface FooterProps {
	currentPath?: string;
}

export function Footer({ currentPath }: FooterProps = {}) {
	const location = useLocation();
	const path = currentPath || location.pathname;
	const isHomePage = path === "/";

	return (
		<footer className="bg-white/90 backdrop-blur-sm mt-16 md:mt-24">
			<div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6">
				<div className="text-center mb-16">
					{isHomePage && (
						<div className="w-full max-w-xl mx-auto mb-8">
							<iframe
								width="560"
								height="315"
								src="https://www.youtube.com/embed/jdMzhIiqh9Q?si=8N4L5jFazup17ujA"
								title="YouTube video player"
								frameBorder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								referrerPolicy="strict-origin-when-cross-origin"
								allowFullScreen
								className="mx-auto w-full aspect-video"
							/>
						</div>
					)}

					<div className="w-full max-w-xl mx-auto">
						<div className="aspect-[4/5] relative">
							<iframe
								src="https://www.instagram.com/pandidorty/embed"
								title="Instagram feed Pandí dorty"
								className="absolute inset-0 w-full h-full"
								frameBorder="0"
								scrolling="no"
								allowTransparency={true}
							/>
						</div>
					</div>
				</div>

				<div className="grid gap-8 md:grid-cols-4 text-center md:text-left">
					<div className="col-span-full md:col-span-1 flex flex-col items-center md:items-start">
						<img
							src="/logo.png"
							alt="Pandí dorty"
							className="h-12 md:h-14 mb-3 md:mb-4"
						/>
						<p className="text-base mb-4">
							zakázková výroba dortů a dalších sladkých radostí
						</p>
					</div>

					<div>
						<h3 className="font-bold text-lg mb-3 md:mb-4">Menu</h3>
						<div className="space-y-2 text-black">
							<p className="text-base">
								<a
									href="/"
									className="hover:text-custom-blue transition-colors"
								>
									Domů
								</a>
							</p>
							<p className="text-base">
								<a
									href="/cakes"
									className="hover:text-custom-blue transition-colors"
								>
									Nabídka a ceník
								</a>
							</p>
							<p className="text-base">
								<a
									href="/objednavka"
									className="hover:text-custom-blue transition-colors"
								>
									Objednávka
								</a>
							</p>
							<p className="text-base">
								<a
									href="/gallery"
									className="hover:text-custom-blue transition-colors"
								>
									Galerie
								</a>
							</p>
						</div>
					</div>

					<div id="contact">
						<h3 className="font-bold text-lg mb-3 md:mb-4">Kontakt</h3>
						<div className="space-y-2 text-black">
							<p className="text-base">Maďarská 6088/18, Ostrava-Poruba</p>
							<p className="text-base">774 182 160</p>
							<p className="text-base">pandidorty@gmail.com</p>
						</div>
					</div>

					<div>
						<h3 className="font-bold text-lg mb-3 md:mb-4">Sledujte nás</h3>
						<div className="flex gap-6 md:gap-4 justify-center md:justify-start">
							<a
								href="https://www.facebook.com/people/Pand%C3%AD-dorty/61556442698002/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-black hover:text-custom-blue transition-colors"
							>
								<span className="sr-only">Facebook</span>
								<svg
									className="w-7 h-7 md:w-6 md:h-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
										clipRule="evenodd"
									/>
								</svg>
							</a>
							<a
								href="https://www.instagram.com/pandidorty/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-black hover:text-custom-blue transition-colors"
							>
								<span className="sr-only">Instagram</span>
								<svg
									className="w-7 h-7 md:w-6 md:h-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
										clipRule="evenodd"
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>

				<div className="border-t border-black mt-8 md:mt-12 pt-6 md:pt-8 text-center text-black text-sm md:text-base">
					<p>
						&copy; {new Date().getFullYear()} Mai Linh Nguyenová. Všechna práva
						vyhrazena.
					</p>
				</div>
			</div>
		</footer>
	);
}
