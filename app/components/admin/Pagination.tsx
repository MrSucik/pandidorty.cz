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
	return (
		<nav
			className="mt-8 flex justify-center items-center space-x-1 text-sm"
			aria-label="Pagination"
		>
			{/* Previous */}
			{currentPage > 1 ? (
				<Link
					to={paramBuilder(currentPage - 1)}
					className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
				>
					Předchozí
				</Link>
			) : (
				<span className="px-3 py-1 rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed">
					Předchozí
				</span>
			)}

			{/* page numbers */}
			{Array.from({ length: totalPages }).map((_, idx) => {
				const pageNum = idx + 1;
				const isCurrent = pageNum === currentPage;
				return (
					<Link
						key={pageNum}
						to={paramBuilder(pageNum)}
						className={`px-3 py-1 rounded-md border ${
							isCurrent
								? "bg-pink-600 text-white border-pink-600"
								: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
						}`}
					>
						{pageNum}
					</Link>
				);
			})}

			{/* Next */}
			{currentPage < totalPages ? (
				<Link
					to={paramBuilder(currentPage + 1)}
					className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
				>
					Další
				</Link>
			) : (
				<span className="px-3 py-1 rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed">
					Další
				</span>
			)}
		</nav>
	);
}
