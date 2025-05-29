import { useEffect, useState } from "react";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import OrderCard from "../../components/admin/OrderCard";
import Pagination from "../../components/admin/Pagination";
import { getOrdersPaged } from "../../server/get-orders.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	// Pagination params
	const pageParam = url.searchParams.get("page");
	const page = Math.max(Number(pageParam) || 1, 1);
	const pageSize = 10;

	// Sorting params
	const allowedSortFields = [
		"createdAt",
		"deliveryDate",
		"orderNumber",
		"customerName",
	] as const;
	type SortField = (typeof allowedSortFields)[number];

	let sort: SortField = "createdAt";
	const sortParam = url.searchParams.get("sort");
	if (sortParam && allowedSortFields.includes(sortParam as SortField)) {
		sort = sortParam as SortField;
	}

	const dirParam = url.searchParams.get("dir");
	const dir: "asc" | "desc" =
		dirParam === "asc" || dirParam === "desc"
			? (dirParam as "asc" | "desc")
			: "desc";

	// Filtering params – status (REMOVED)

	const searchParam = url.searchParams.get("q") ?? "";

	const { orders, total } = await getOrdersPaged({
		sort,
		dir,
		limit: pageSize,
		offset: (page - 1) * pageSize,
		search: searchParam,
	});

	const totalOrders = total;
	const totalPages = Math.max(Math.ceil(totalOrders / pageSize), 1);
	const currentPage = Math.min(page, totalPages);

	const search = searchParam;

	return {
		orders,
		totalOrders,
		totalPages,
		currentPage,
		sort,
		dir,
		search,
	};
}

function AdminOrders() {
	const {
		orders,
		totalOrders,
		totalPages,
		currentPage,
		sort,
		dir,
		search: searchParam,
	} = useLoaderData<typeof loader>();

	const navigate = useNavigate();
	const location = useLocation();

	const [searchInput, setSearchInput] = useState(searchParam);

	// debounce: update URL 300ms after stop typing
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const id = setTimeout(() => {
			if (searchInput !== searchParam) {
				updateQueryParams({ q: searchInput, page: "1" });
			}
		}, 300);
		return () => clearTimeout(id);
	}, [searchInput]);

	// Helper to update query params while preserving others
	const updateQueryParams = (params: Record<string, string>) => {
		const search = new URLSearchParams(location.search);
		for (const [key, value] of Object.entries(params)) {
			search.set(key, value);
		}
		navigate({ pathname: location.pathname, search: `?${search.toString()}` });
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Správa objednávek
							</h1>
							<p className="mt-2 text-gray-600">
								Celkem objednávek: {totalOrders}
							</p>
						</div>
						<Link
							to="/admin"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-pink-600 bg-pink-100 hover:bg-pink-200"
						>
							<svg
								className="mr-2 -ml-1 w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="Šipka zpět"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							Zpět na dashboard
						</Link>
					</div>
				</div>

				{/* Sorting & Filtering controls */}
				<div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Sort Control */}
						<div className="space-y-2">
							<label
								htmlFor="sort"
								className="block text-sm font-medium text-gray-900"
							>
								<svg
									className="inline w-4 h-4 mr-2 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									role="img"
									aria-label="Ikona řazení"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
									/>
								</svg>
								Řadit podle
							</label>
							<select
								id="sort"
								className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm"
								value={`${sort}|${dir}`}
								onChange={(e) => {
									const [newSort, newDir] = e.target.value.split("|");
									updateQueryParams({ sort: newSort, dir: newDir, page: "1" });
								}}
							>
								<option value="createdAt|desc">
									Datum vytvoření – nejnovější
								</option>
								<option value="createdAt|asc">
									Datum vytvoření – nejstarší
								</option>
								<option value="deliveryDate|asc">
									Datum doručení – nejbližší
								</option>
								<option value="deliveryDate|desc">
									Datum doručení – nejpozdější
								</option>
								<option value="customerName|asc">Zákazník A → Z</option>
								<option value="customerName|desc">Zákazník Z → A</option>
								<option value="orderNumber|asc">Číslo objednávky ↑</option>
								<option value="orderNumber|desc">Číslo objednávky ↓</option>
							</select>
						</div>

						{/* Search */}
						<div className="space-y-2">
							<label
								htmlFor="search"
								className="block text-sm font-medium text-gray-900"
							>
								<svg
									className="inline w-4 h-4 mr-2 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									role="img"
									aria-label="Ikona vyhledávání"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								Hledat
							</label>
							<div className="relative">
								<input
									id="search"
									type="text"
									placeholder="Jméno, email, číslo objednávky..."
									className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm pl-10 pr-4 py-2"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
								/>
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg
										className="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="Ikona vyhledávání"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</div>
								{searchInput && (
									<button
										type="button"
										className="absolute inset-y-0 right-0 pr-3 flex items-center"
										onClick={() => setSearchInput("")}
									>
										<svg
											className="h-4 w-4 text-gray-400 hover:text-gray-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Vymazat vyhledávání"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{totalOrders === 0 && (
					<div className="text-center py-12">
						<p className="text-gray-500">Žádné objednávky nenalezeny.</p>
					</div>
				)}

				{orders.length > 0 && (
					<ul className="space-y-6">
						{orders.map((order) => (
							<OrderCard key={order.id} order={order} />
						))}
					</ul>
				)}

				{/* Pagination */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					paramBuilder={(page) =>
						`?page=${page}&sort=${sort}&dir=${dir}&q=${encodeURIComponent(
							searchParam,
						)}`
					}
				/>
			</div>
		</div>
	);
}

export default AdminOrders;
