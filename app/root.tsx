import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type MouseEvent, useEffect, useState } from "react";
import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from "react-router";
import type { Route } from "./+types/root";
import { Footer } from "./components/Footer";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

// Create a client for React Query
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

// ---------------------------------------------
// Navigation copied and adapted from the legacy
// TanStack Router implementation
// ---------------------------------------------

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
	// biome-ignore lint/correctness/useExhaustiveDependencies: Route changes should reset menu state
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
									Nabídka a ceník
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
								Nabídka a ceník
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

// ---------------------------------------------
// Root application wrapper
// ---------------------------------------------

export default function App() {
	const location = useLocation();
	const showFooterAndNavigation = !location.pathname.startsWith("/admin");

	return (
		<QueryClientProvider client={queryClient}>
			{showFooterAndNavigation && <Navigation />}
			<Outlet />
			{showFooterAndNavigation && <Footer />}
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
