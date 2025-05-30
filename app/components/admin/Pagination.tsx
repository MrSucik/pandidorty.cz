import { Link } from "react-router";

interface Props {
	currentPage: number;
	totalPages: number;
	paramBuilder: (page: number) => string; // returns query string starting with ?
}

export default function Pagination({
	currentPage,
	totalPages,
	paramBuilder,
}: Props) {
	if (totalPages <= 1) return null;

	// For mobile: show max 3 pages around current page
	// For desktop: show max 7 pages around current page
	const getVisiblePages = (isMobile = false) => {
		const maxVisible = isMobile ? 3 : 7;
		const half = Math.floor(maxVisible / 2);

		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, currentPage + half);

		// Adjust if we're near the beginning or end
		if (end - start + 1 < maxVisible) {
			if (start === 1) {
				end = Math.min(totalPages, start + maxVisible - 1);
			} else {
				start = Math.max(1, end - maxVisible + 1);
			}
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	return (
		<nav
			className="mt-6 sm:mt-8 flex justify-center items-center space-x-1 text-sm px-4"
			aria-label="Pagination"
		>
			{/* Previous */}
			{currentPage > 1 ? (
				<Link
					to={paramBuilder(currentPage - 1)}
					className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
				>
					<span className="hidden sm:inline">Předchozí</span>
					<span className="sm:hidden">‹</span>
				</Link>
			) : (
				<span className="px-2 sm:px-3 py-1 rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed text-xs sm:text-sm">
					<span className="hidden sm:inline">Předchozí</span>
					<span className="sm:hidden">‹</span>
				</span>
			)}

			{/* Page numbers - mobile version (fewer pages) */}
			<div className="sm:hidden flex space-x-1">
				{getVisiblePages(true).map((pageNum) => {
					const isCurrent = pageNum === currentPage;
					return (
						<Link
							key={pageNum}
							to={paramBuilder(pageNum)}
							className={`px-2 py-1 rounded-md border text-xs ${
								isCurrent
									? "bg-pink-600 text-white border-pink-600"
									: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
							}`}
						>
							{pageNum}
						</Link>
					);
				})}
			</div>

			{/* Page numbers - desktop version (more pages) */}
			<div className="hidden sm:flex space-x-1">
				{getVisiblePages(false).map((pageNum) => {
					const isCurrent = pageNum === currentPage;
					return (
						<Link
							key={pageNum}
							to={paramBuilder(pageNum)}
							className={`px-3 py-1 rounded-md border text-sm ${
								isCurrent
									? "bg-pink-600 text-white border-pink-600"
									: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
							}`}
						>
							{pageNum}
						</Link>
					);
				})}
			</div>

			{/* Next */}
			{currentPage < totalPages ? (
				<Link
					to={paramBuilder(currentPage + 1)}
					className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
				>
					<span className="hidden sm:inline">Další</span>
					<span className="sm:hidden">›</span>
				</Link>
			) : (
				<span className="px-2 sm:px-3 py-1 rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed text-xs sm:text-sm">
					<span className="hidden sm:inline">Další</span>
					<span className="sm:hidden">›</span>
				</span>
			)}
		</nav>
	);
}
