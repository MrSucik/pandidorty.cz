import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cakes")({
	component: Cakes,
});

function Cakes() {
	return (
		<div className="min-h-screen relative">
			<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
				<div className="bg-flowers h-full w-full -z-10" />
			</div>
			<div className="max-w-7xl mx-auto relative">
				<div className="max-w-4xl mx-auto px-4 md:px-6 space-y-16 md:space-y-24 pt-24 md:pt-28 pb-16">
					{/* PŘÍCHUTĚ DORTŮ */}
					<section
						id="cake-flavors"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h1 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8">
							PŘÍCHUTĚ DORTŮ
						</h1>
						<p className="text-base md:text-lg text-center mb-8">
							Sestav si svůj dort!
						</p>
						<p className="text-base md:text-lg text-center mb-8">
							Dort se skládá ze 4 piškotů a 3 vrstev krému + volitelný doplněk
							(max. 2). K jednomu dortu lze vybrat pouze 1 typ korpusu a 1 typ
							krému. Krémy děláme na bázi mascarpone a šlehačky. Po domluvě lze
							dort udělat z bezlepkové mouky či z bezlaktózových surovin.
						</p>
						<div className="grid md:grid-cols-3 gap-12 md:gap-8">
							{/* KORPUS */}
							<div className="space-y-4 md:space-y-3 text-center">
								<h2 className="text-xl md:text-2xl font-bold mb-4">KORPUS</h2>
								<p>vanilkový</p>
								<p>čokoládový</p>
								<p>red velvet</p>
								<p>mrkvový</p>
							</div>
							{/* KRÉM */}
							<div className="space-y-4 md:space-y-3 text-center">
								<h2 className="text-xl md:text-2xl font-bold mb-4">KRÉM</h2>
								<p>vanilka</p>
								<p>čokoláda</p>
								<p>pistácie</p>
								<p>karamel</p>
								<p>kokos & bílá čokoláda</p>
							</div>
							{/* DOPLNĚK */}
							<div className="space-y-4 md:space-y-3 text-center">
								<h2 className="text-xl md:text-2xl font-bold mb-4">
									DOPLNĚK (volitelný)
								</h2>
								<p>maliny</p>
								<p>lesní ovoce</p>
								<p>jahody</p>
								<p>višně</p>
								<p>mango & marakuja</p>
								<p>karamel</p>
							</div>
						</div>
					</section>

					{/* OBLÍBENÉ KOMBINACE */}
					<section
						id="favorite-combinations"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h2 className="text-xl md:text-2xl font-bold text-center mb-6">
							OBLÍBENÉ KOMBINACE ♡
						</h2>
						<div className="space-y-3 md:space-y-2 text-center">
							<p>1. vanilkový korpus, vanilkový krém + lesní ovoce</p>
							<p>2. čokoládový korpus, čokoládový krém + maliny</p>
							<p>3. red velvet korpus, vanilkový krém + maliny</p>
							<p>4. čokoládový korpus, krém kokos & bílá čokoláda</p>
							<p>5. mrkvový korpus, vanilkový krém + karamel</p>
							<p>
								6. vanilkový korpus, pistáciový krém + maliny a mango & marakuja
							</p>
							<p>7. vanilkový korpus, karamelový krém + višně</p>
						</div>
					</section>

					{/* CENÍK DORTŮ */}
					<section
						id="cake-prices"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
							CENÍK DORTŮ
						</h2>
						<p className="text-base md:text-lg text-center mb-8">
							Ceník platný od 1.3.2025.
						</p>
						<div className="space-y-8 text-center">
							<p className="text-base md:text-lg mb-6">
								Cena se odvíjí od velikosti dortu, počtu doplňků a dále od
								nákladnosti a složitosti zdobení.
							</p>
							<p className="text-base md:text-lg mb-6">
								Zpravidla si bereme zálohu - cca polovinu z celkové ceny.
								Objednávka je platná až po uhrazení zálohy! V případě neuhrazení
								zálohy nejpozději týden před termínem vyzvednutí se objednávka
								stornuje. Záloha je nevratná.
							</p>
							<div className="space-y-4 md:space-y-3">
								<p className="text-base md:text-lg">
									ø 11 cm (2-4 porce) - od 450 Kč (nižší, cca 650 g)
								</p>
								<p className="text-base md:text-lg">
									ø 16 cm (8-10 porcí) - od 1300 Kč (cca 1,8 kg)
								</p>
								<p className="text-base md:text-lg">
									ø 21 cm (12-14 porcí) - od 1820 Kč (cca 3,2 kg)
								</p>
								<p className="text-base md:text-lg">
									ø 26 cm (20-22 porcí) - od 2860 Kč (cca 5 kg)
								</p>
							</div>
							<p className="text-base md:text-lg max-w-2xl mx-auto">
								Dorty mají do výšky 13-14 cm. Za nákladnější zdobení se považují
								např. jedlé pláty zlata, modelace, jedlý tisk či větší množství
								květin na dortu.
							</p>

							{/* Dvoupatrové dorty */}
							<div>
								<h3 className="text-xl md:text-2xl font-bold text-center mb-4">
									Dvoupatrové dorty:
								</h3>
								<div className="space-y-4 md:space-y-3">
									<p className="text-base md:text-lg">
										11+16 cm (15 porcí) - od 2050 Kč
									</p>
									<p className="text-base md:text-lg">
										16+21 cm (25 porcí) - od 3350 Kč
									</p>
									<p className="text-base md:text-lg">
										21+26 cm (35 porcí) - od 4650 Kč
									</p>
								</div>
							</div>

							{/* Třípatrové dorty */}
							<div>
								<h3 className="text-xl md:text-2xl font-bold text-center mb-4">
									Třípatrové dorty:
								</h3>
								<div className="space-y-4 md:space-y-3">
									<p className="text-base md:text-lg">
										11+16+21 cm (30 porcí) - od 4050 Kč
									</p>
									<p className="text-base md:text-lg">
										16+21+26 cm (45 porcí) - od 6000 Kč
									</p>
									<p className="text-base md:text-lg">
										21+26+31 cm (65 porcí) - od 8700 Kč
									</p>
								</div>
							</div>

							{/* Cena doplňků */}
							<div>
								<h3 className="text-xl md:text-2xl font-bold text-center mb-4">
									Cena doplňků:
								</h3>
								<div className="space-y-4 md:space-y-3">
									<p className="text-base md:text-lg">ø 11 cm: 15 Kč</p>
									<p className="text-base md:text-lg">ø 16 cm: 35 Kč</p>
									<p className="text-base md:text-lg">ø 21 cm: 50 Kč</p>
									<p className="text-base md:text-lg">ø 26 cm: 75 Kč</p>
									<p className="text-base md:text-lg">ø 31 cm: 100 Kč</p>
								</div>
							</div>

							<p className="text-base md:text-lg italic">
								Cena dortu z bezlepkové mouky je s přirážkou 15 %.<br />
								Cena dortu z bezlaktózových surovin je s přirážkou 20 %.
							</p>
						</div>
					</section>

					{/* SWEETBAR */}
					<section
						id="sweetbar"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
							SWEETBAR
						</h2>
						<p className="text-base md:text-lg text-center mb-8">
							Zákusky, které zahřejí u srdce a splní Vaše nejsladší přání.
						</p>

						{/* Sweetbar items */}
						<div className="space-y-12 md:space-y-8">
							{/* VĚTRNÍKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">VĚTRNÍKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>karamel</p>
									<p>pistácie</p>
									<p>oříšek</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 72 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* MINI VĚTRNÍČKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">MINI VĚTRNÍČKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>karamel</p>
									<p>pistácie</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 37 Kč</p>
									<p>Minimální odběr: 20 ks / příchuť</p>
								</div>
							</div>

							{/* TARTALETKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">TARTALETKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>čokoláda</p>
									<p>čokoláda & karamel</p>
									<p>malina</p>
									<p>pistácie</p>
									<p>lesní ovoce</p>
									<p>baileys & bílá čokoláda</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 40 Kč</p>
									<p>Minimální odběr: 10 ks / příchuť</p>
								</div>
							</div>

							{/* MAKRONKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">MAKRONKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>malina</p>
									<p>lesní ovoce</p>
									<p>mango & marakuja</p>
									<p>kokos</p>
									<p>karamel</p>
									<p>pistácie</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 39 Kč</p>
									<p>Minimální odběr: 25 ks / příchuť</p>
								</div>
							</div>

							{/* PANNA COTTA */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">PANNA COTTA</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka - lesní ovoce</p>
									<p>kokos - malina</p>
									<p>kokos - mango</p>
									<p>limetka - jahoda</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 60 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* VĚNEČKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">VĚNEČKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>žloutkové</p>
									<p>jahoda</p>
									<p>nutella</p>
									<p>kokos</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 66 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* CUPCAKES */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">CUPCAKES</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>lesní ovoce</p>
									<p>karamel</p>
									<p>pistácie</p>
									<p>nutella</p>
									<p>mango & marakuja</p>
									<p>kokos & bílá čokoláda</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 60 Kč</p>
									<p>Minimální odběr: 14 ks / příchuť</p>
								</div>
							</div>

							{/* BROWNIES */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">BROWNIES</h3>
								<div className="space-y-2 md:space-y-1">
									<p>ze 70% čokolády, s kousky bílé a mléčné čokolády</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 35 Kč</p>
									<p>Minimální odběr: 24 ks / příchuť</p>
								</div>
							</div>

							{/* MINI DORTÍKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">MINI DORTÍKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>příchutě viz dorty</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 95 Kč</p>
									<p>Minimální odběr: 10 ks / příchuť</p>
								</div>
							</div>

							{/* DORTOVÁ LÍZÁTKA */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">
									DORTOVÁ LÍZÁTKA
								</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>red velvet</p>
									<p>skořice</p>
									<p>perníček</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 25 Kč</p>
									<p>Minimální odběr: 10 ks / příchuť</p>
								</div>
							</div>

							{/* DORTOVÉ NANUKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">DORTOVÉ NANUKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>red velvet</p>
									<p>skořice</p>
									<p>perníček</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 50 Kč</p>
									<p>Minimální odběr: 10 ks / příchuť</p>
								</div>
							</div>

							{/* KREMROLKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">KREMROLKY</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>pistácie</p>
									<p>oříšek</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 40 Kč</p>
									<p>Minimální odběr: 10 ks / příchuť</p>
								</div>
							</div>

							{/* MINI CHEESECAKES */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">
									MINI CHEESECAKES
								</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka - lesní ovoce</p>
									<p>vanilka - mango & marakuja</p>
									<p>vanilka - pistácie</p>
									<p>vanilka - karamel</p>
									<p>čokoláda - čokoláda</p>
									<p>čokoláda - nutella</p>
									<p>čokoláda - lesní ovoce</p>
									<p>čokoláda - karamel</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 50 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* PROFITEROLES */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">PROFITEROLES</h3>
								<div className="space-y-2 md:space-y-1">
									<p>žloutkový krém</p>
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>pistácie</p>
									<p>oříšek</p>
									<p>lesní ovoce</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 25 Kč</p>
									<p>Minimální odběr: 20 ks / příchuť</p>
								</div>
							</div>

							{/* FRANCOUZSKÉ VĚTRNÍČKY */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">
									FRANCOUZSKÉ VĚTRNÍČKY
								</h3>
								<div className="space-y-2 md:space-y-1">
									<p>vanilka</p>
									<p>čokoláda</p>
									<p>lesní ovoce</p>
									<p>malina</p>
									<p>pistácie</p>
									<p>oříšek</p>
									<p>kokos & bílá čokoláda</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 48 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* MINI PAVLOVA */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">MINI PAVLOVA</h3>
								<div className="space-y-2 md:space-y-1">
									<p>mango & marakuja</p>
									<p>malina</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 70 Kč</p>
									<p>Minimální odběr: 14 ks / příchuť</p>
								</div>
							</div>

							{/* MÍŠA KELÍMEK */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">MÍŠA KELÍMEK</h3>
								<div className="space-y-2 md:space-y-1">
									<p>čokoládový korpus, tvarohový krém, čokoládová křupinka</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 45 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* ČOKO MOUSSE */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">ČOKO MOUSSE</h3>
								<div className="space-y-2 md:space-y-1">
									<p>tmavá čokoláda</p>
									<p>bílá čokoláda</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 45 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* TIRAMISU KELÍMEK */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">
									TIRAMISU KELÍMEK
								</h3>
								<div className="space-y-2 md:space-y-1">
									<p>
										domácí piškoty máčené v kávě, krém z mascarpone a vajec,
										holandské kakao
									</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 45 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>

							{/* KRTKŮV DORT V KELÍMKU */}
							<div className="text-center">
								<h3 className="text-xl md:text-2xl font-bold mb-4">
									KRTKŮV DORT V KELÍMKU
								</h3>
								<div className="space-y-2 md:space-y-1">
									<p>
										čokoládový korpus, smetanový krém, strouhaná čokoláda a banán
									</p>
								</div>
								<div className="mt-4 md:mt-3">
									<p>Cena: 45 Kč</p>
									<p>Minimální odběr: 12 ks / příchuť</p>
								</div>
							</div>
						</div>
					</section>

					{/* ZÁKUSKY BEZ LEPKU */}
					<section
						id="gluten-free"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h2 className="text-xl md:text-2xl font-bold text-center mb-6">
							ZÁKUSKY BEZ LEPKU
						</h2>
						<div className="space-y-3 md:space-y-2 text-center">
							<p>* makronky</p>
							<p>* mini pavlovy</p>
							<p>* panna cotta</p>
							<p>* čoko mousse</p>
						</div>
						<p className="text-base md:text-lg text-center mt-6">
							Na vyžádání lze bez lepku udělat (s příplatkem 15 %):
						</p>
						<div className="space-y-3 md:space-y-2 text-center">
							<p>* mini cheesecakes</p>
							<p>* brownies</p>
							<p>* cupcakes</p>
							<p>* větrníky, mini větrníčky</p>
							<p>* věnečky</p>
							<p>* mini dortíky</p>
						</div>
					</section>

					{/* ZÁKUSKY BEZ OŘÍŠKŮ */}
					<section
						id="nut-free"
						className="scroll-mt-20 bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm"
					>
						<h2 className="text-xl md:text-2xl font-bold text-center mb-6">
							ZÁKUSKY BEZ OŘÍŠKŮ
						</h2>
						<p className="text-base md:text-lg text-center mb-6">
							Oříšky (konkrétně mandle) se vyskytují pouze v makronkách. Dále se
							oříšky vyskytují v příchutích pistácie, oříšek, nutella.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
} 