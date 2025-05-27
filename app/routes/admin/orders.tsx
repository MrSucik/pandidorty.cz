import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { OrderWithPhotos } from "../../server/get-orders.server";
import { getAllOrders } from "../../server/get-orders.server";

export async function loader(_: LoaderFunctionArgs) {
	return await getAllOrders();
}

function AdminOrders() {
	const orders = useLoaderData() as OrderWithPhotos[];
	const [selectedOrder, setSelectedOrder] = useState<OrderWithPhotos | null>(
		null,
	);

	const showOrderDetails = (orderNumber: string) => {
		const order = orders.find((o) => o.orderNumber === orderNumber);
		if (order) {
			setSelectedOrder(order);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "processing":
				return "bg-blue-100 text-blue-800";
			case "shipped":
				return "bg-purple-100 text-purple-800";
			case "delivered":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "pending":
				return "Čekající";
			case "processing":
				return "Zpracovává se";
			case "shipped":
				return "Odesláno";
			case "delivered":
				return "Doručeno";
			case "cancelled":
				return "Zrušeno";
			default:
				return status;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Správa objednávek
							</h1>
							<p className="mt-2 text-gray-600">
								Celkem objednávek: {orders.length}
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

				<div className="bg-white shadow overflow-hidden sm:rounded-md">
					<ul className="divide-y divide-gray-200">
						{orders.map((order) => (
							<li key={order.id}>
								<div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center justify-between">
												<p className="text-sm font-medium text-pink-600 truncate">
													{order.orderNumber}
												</p>
												<div className="ml-2 flex-shrink-0 flex">
													<p
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
													>
														{getStatusText(order.status)}
													</p>
												</div>
											</div>
											<div className="mt-2 sm:flex sm:justify-between">
												<div className="sm:flex">
													<p className="flex items-center text-sm text-gray-500">
														<span className="font-medium">
															{order.customerName}
														</span>
														<span className="ml-2">
															({order.customerEmail})
														</span>
													</p>
												</div>
												<div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
													<p>
														Doručení:{" "}
														{format(
															new Date(order.deliveryDate),
															"dd.MM.yyyy",
															{ locale: cs },
														)}
													</p>
												</div>
											</div>
											<div className="mt-2 flex items-center text-sm text-gray-500">
												<div className="flex space-x-4">
													{order.orderCake && (
														<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
															🎂 Dort ({order.cakeSize}, {order.cakeFlavor})
														</span>
													)}
													{order.orderDessert && (
														<span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
															🧁 Dezerty ({order.dessertChoice})
														</span>
													)}
												</div>
											</div>
										</div>
										<div className="ml-4">
											<button
												type="button"
												onClick={() => showOrderDetails(order.orderNumber)}
												className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700"
											>
												Detail
											</button>
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>

				{orders.length === 0 && (
					<div className="text-center py-12">
						<p className="text-gray-500">Žádné objednávky nenalezeny.</p>
					</div>
				)}
			</div>

			{/* Order Detail Modal */}
			{selectedOrder && (
				<div
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-24"
					onClick={() => setSelectedOrder(null)}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setSelectedOrder(null);
						}
					}}
					aria-label="Close modal"
				>
					{/* Modal content */}
					<div
						className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[90dvh] overflow-y-auto p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								setSelectedOrder(null);
							}
						}}
						tabIndex={-1}
					>
						<div className="mt-3">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-medium text-gray-900">
									Detail objednávky {selectedOrder.orderNumber}
								</h3>
								<button
									type="button"
									onClick={() => setSelectedOrder(null)}
									className="text-gray-400 hover:text-gray-600"
								>
									<span className="sr-only">Zavřít</span>
									<svg
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										role="img"
										aria-label="Zavřít"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<div className="space-y-4">
								<div>
									<h4 className="font-medium text-gray-900">Zákazník</h4>
									<p className="text-gray-600">{selectedOrder.customerName}</p>
									<p className="text-gray-600">{selectedOrder.customerEmail}</p>
									{selectedOrder.customerPhone && (
										<p className="text-gray-600">
											{selectedOrder.customerPhone}
										</p>
									)}
								</div>

								<div>
									<h4 className="font-medium text-gray-900">Objednávka</h4>
									<div className="space-y-2">
										{selectedOrder.orderCake && (
											<div className="bg-blue-50 p-3 rounded">
												<p className="font-medium">🎂 Dort</p>
												<p>Velikost: {selectedOrder.cakeSize}</p>
												<p>Příchuť: {selectedOrder.cakeFlavor}</p>
												{selectedOrder.cakeMessage && (
													<p>Vzkaz: {selectedOrder.cakeMessage}</p>
												)}
											</div>
										)}
										{selectedOrder.orderDessert && (
											<div className="bg-green-50 p-3 rounded">
												<p className="font-medium">🧁 Dezerty</p>
												<p>{selectedOrder.dessertChoice}</p>
											</div>
										)}
									</div>
								</div>

								<div>
									<h4 className="font-medium text-gray-900">Doručení</h4>
									<p className="text-gray-600">
										{format(
											new Date(selectedOrder.deliveryDate),
											"dd.MM.yyyy (EEEE)",
											{ locale: cs },
										)}
									</p>
								</div>

								{selectedOrder.photos && selectedOrder.photos.length > 0 && (
									<div>
										<h4 className="font-medium text-gray-900">
											Fotografie ({selectedOrder.photos.length})
										</h4>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
											{selectedOrder.photos.map((photo) => (
												<div key={photo.id} className="relative">
													<img
														src={`/photo/${photo.id}`}
														alt={photo.originalName}
														className="w-full h-32 object-cover rounded border"
													/>
													<p className="text-xs text-gray-500 mt-1 truncate">
														{photo.originalName}
													</p>
												</div>
											))}
										</div>
									</div>
								)}

								<div>
									<h4 className="font-medium text-gray-900">Status</h4>
									<span
										className={`px-2 py-1 text-sm rounded-full ${getStatusColor(selectedOrder.status)}`}
									>
										{getStatusText(selectedOrder.status)}
									</span>
								</div>

								<div>
									<h4 className="font-medium text-gray-900">Vytvořeno</h4>
									<p className="text-gray-600">
										{format(
											new Date(selectedOrder.createdAt),
											"dd.MM.yyyy HH:mm",
											{ locale: cs },
										)}
									</p>
								</div>
							</div>

							<div className="mt-6 flex justify-end">
								<button
									type="button"
									onClick={() => setSelectedOrder(null)}
									className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
								>
									Zavřít
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default AdminOrders;
