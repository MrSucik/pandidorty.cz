import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRoute,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { Footer } from "~/components/Footer";
import { NotFound } from "~/components/NotFound";
// @ts-expect-error
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "description",
				content: "Pandí dorty - Vaše cukrárna v Ostravě-Porubě",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "Pandí dorty | Zakázková výroba dortů a sladkých radostí",
				description:
					"Zakázková výroba dortů a dalších sladkých radostí v Ostravě. Kvalitní suroviny, poctivá práce a jedinečné dorty na míru.",
			}),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", type: "image/png", href: "/favicon.ico" },
		],
	}),
	errorComponent: (props) => {
		return (
			<RootDocument>
				<DefaultCatchBoundary {...props} />
			</RootDocument>
		);
	},
	notFoundComponent: () => <NotFound />,
	component: RootComponent,
});

function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<RootDocument>
				<Navigation />
				<Outlet />
				<Footer />
			</RootDocument>
		</QueryClientProvider>
	);
}

function Navigation() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const location = useLocation();

	// Handle scroll effect for header background
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // Check initial scroll position

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close menu when route changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setIsMenuOpen(false);
		document.body.style.overflow = "";
	}, [location.pathname]);

	const toggleMenu = () => {
		const newIsOpen = !isMenuOpen;
		setIsMenuOpen(newIsOpen);
		document.body.style.overflow = newIsOpen ? "hidden" : "";
	};

	const handleContactClick = (e: MouseEvent) => {
		e.preventDefault();

		// Close mobile menu if open
		if (isMenuOpen) {
			toggleMenu();
		}

		// Scroll to bottom of page
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth",
		});
	};

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-50 py-3 px-4 md:py-4 md:px-6 transition-colors duration-200 ${
					isScrolled ? "bg-blue-50/97 backdrop-blur-sm" : ""
				}`}
			>
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<Link to="/" className="z-10">
						<img src="/logo-panda.png" alt="Pandí dorty" className="h-16" />
					</Link>

					<button
						type="button"
						className="md:hidden z-50 p-2 text-black hover:text-custom-blue transition-colors"
						aria-label="Menu"
						aria-expanded={isMenuOpen}
						onClick={toggleMenu}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 6h16M4 12h16M4 18h16"
								className={isMenuOpen ? "hidden" : ""}
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
								className={isMenuOpen ? "" : "hidden"}
							/>
						</svg>
					</button>

					<nav className="hidden md:flex items-center">
						<ul className="flex flex-row gap-6 text-base items-center">
							<li>
								<Link
									to="/"
									className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
								>
									Domů
								</Link>
							</li>
							<li>
								<a
									href="/cakes"
									className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
								>
									Nabídka
								</a>
							</li>
							<li>
								<Link
									to="/objednavka"
									className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
								>
									Objednávka
								</Link>
							</li>
							<li>
								<Link
									to="/gallery"
									className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
								>
									Galerie
								</Link>
							</li>
							<li>
								<button
									type="button"
									className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
									onClick={handleContactClick}
								>
									Kontakt
								</button>
							</li>
						</ul>
					</nav>
				</div>
			</header>

			{/* Mobile Menu */}
			<div
				className={`fixed inset-0 bg-white/95 backdrop-blur-sm transition-transform duration-300 z-40 md:hidden ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<nav className="h-full flex items-center justify-center">
					<ul className="flex flex-col gap-8 text-xl text-center">
						<li>
							<Link
								to="/"
								className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
							>
								Domů
							</Link>
						</li>
						<li>
							<a
								href="/cakes"
								className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
							>
								Nabídka
							</a>
						</li>
						<li>
							<Link
								to="/objednavka"
								className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
							>
								Objednávka
							</Link>
						</li>
						<li>
							<Link
								to="/gallery"
								className="hover:text-custom-blue transition-colors py-3 px-6 block font-medium"
							>
								Galerie
							</Link>
						</li>
						<li>
							<button
								type="button"
								className="hover:text-custom-blue transition-colors py-3 px-6 block w-full font-medium"
								onClick={handleContactClick}
							>
								Kontakt
							</button>
						</li>
					</ul>
				</nav>
			</div>
		</>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="cs">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackRouterDevtools position="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
