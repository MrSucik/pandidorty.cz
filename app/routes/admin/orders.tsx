import { useEffect, useState } from "react";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import OrderCard from "../../components/admin/OrderCard";
import Pagination from "../../components/admin/Pagination";
import { getOrdersPaged } from "../../server/get-orders.server";
import { allowedStatuses } from "../../utils/orderStatus";

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
		"status",
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

	// Filtering params – status
	type StatusFilter = (typeof allowedStatuses)[number] | "all";

	let status: StatusFilter = "all";
	const statusParam = url.searchParams.get("status");
	if (
		statusParam &&
		(allowedStatuses as readonly string[]).includes(statusParam)
	) {
		status = statusParam as StatusFilter;
	}

	const searchParam = url.searchParams.get("q") ?? "";

	const { orders, total } = await getOrdersPaged({
		status,
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
		status,
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
		status,
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
				<div className="mb-6 flex items-center flex-wrap gap-4">
					<label htmlFor="sort" className="text-sm font-medium text-gray-700">
						Řadit podle:
					</label>
					<select
						id="sort"
						className="border-gray-300 text-sm rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
						value={`${sort}|${dir}`}
						onChange={(e) => {
							const [newSort, newDir] = e.target.value.split("|");
							updateQueryParams({ sort: newSort, dir: newDir, page: "1" });
						}}
					>
						<option value="createdAt|desc">Datum vytvoření – nejnovější</option>
						<option value="createdAt|asc">Datum vytvoření – nejstarší</option>
						<option value="deliveryDate|asc">Datum doručení – nejbližší</option>
						<option value="deliveryDate|desc">
							Datum doručení – nejpozdější
						</option>
						<option value="customerName|asc">Zákazník A → Z</option>
						<option value="customerName|desc">Zákazník Z → A</option>
						<option value="orderNumber|asc">Číslo objednávky ↑</option>
						<option value="orderNumber|desc">Číslo objednávky ↓</option>
						<option value="status|asc">Status A → Z</option>
						<option value="status|desc">Status Z → A</option>
					</select>

					<label htmlFor="status" className="text-sm font-medium text-gray-700">
						Status:
					</label>
					<select
						id="status"
						className="border-gray-300 text-sm rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
						value={status}
						onChange={(e) => {
							updateQueryParams({ status: e.target.value, page: "1" });
						}}
					>
						<option value="all">Všechny</option>
						{allowedStatuses.map((s) => (
							<option key={s} value={s}>
								{s === "created"
									? "Vytvořeno"
									: s === "paid"
										? "Zaplaceno"
										: "Doručeno"}
							</option>
						))}
					</select>

					<label htmlFor="search" className="text-sm font-medium text-gray-700">
						Hledat:
					</label>
					<input
						id="search"
						type="text"
						placeholder="Jméno, email, číslo objednávky..."
						className="border-gray-300 text-sm rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 px-2 py-1"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
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
						`?page=${page}&sort=${sort}&dir=${dir}&status=${status}&q=${encodeURIComponent(
							searchParam,
						)}`
					}
				/>
			</div>
		</div>
	);
}

export default AdminOrders;
