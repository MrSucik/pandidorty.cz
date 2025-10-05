import {
	differenceInCalendarDays,
	format,
	formatDistanceToNow,
} from "date-fns";
import { cs } from "date-fns/locale";
import type { OrderWithPhotos } from "../../server/get-orders.server";
import DeliveredStatusButton from "./DeliveredStatusButton";
import PaidStatusButton from "./PaidStatusButton";

interface Props {
	order: OrderWithPhotos;
}

export default function OrderCard({ order }: Props) {
	const isOverdue =
		differenceInCalendarDays(new Date(), new Date(order.deliveryDate)) > 0;

	return (
		<li className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden border border-gray-100">
			{/* Header Section */}
			<div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 border-b border-gray-100">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
					<div className="flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="text-base font-bold text-gray-900">
								{order.orderNumber}
							</h3>
							{order.orderKind === "christmas_tasting" && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									🎄 Vánoční ochutnávka
								</span>
							)}
							{isOverdue && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
									<svg
										className="w-3 h-3 mr-1"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
									Po termínu
								</span>
							)}
						</div>
						<p className="text-xs text-gray-600 mt-1">
							{format(new Date(order.createdAt), "d.M.yyyy HH:mm", {
								locale: cs,
							})}
							{" • "}
							{formatDistanceToNow(new Date(order.createdAt), {
								addSuffix: true,
								locale: cs,
							})}
						</p>
					</div>

					{/* Status Buttons - Hidden on mobile, shown on larger screens */}
					<div className="hidden sm:flex flex-col gap-1">
						<DeliveredStatusButton
							orderId={order.id}
							deliveredAt={order.deliveredAt}
						/>
						<PaidStatusButton orderId={order.id} paidAt={order.paidAt} />
					</div>
				</div>

				{/* Status Buttons - Shown on mobile below title and date */}
				<div className="flex sm:hidden flex-col gap-2 mt-3">
					<DeliveredStatusButton
						orderId={order.id}
						deliveredAt={order.deliveredAt}
					/>
					<PaidStatusButton orderId={order.id} paidAt={order.paidAt} />
				</div>
			</div>

			{/* Main Content */}
			<div className="p-4 space-y-4">
				{/* Customer & Order Items Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Customer Section */}
					<div>
						<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
							Zákazník
						</h4>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<svg
									className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								<span className="text-sm font-medium text-gray-900 break-words">
									{order.customerName}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<svg
									className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								<a
									href={`mailto:${order.customerEmail}`}
									className="text-sm text-blue-600 hover:text-blue-800 break-all"
								>
									{order.customerEmail}
								</a>
							</div>
							{order.customerPhone && (
								<div className="flex items-center gap-2">
									<svg
										className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
									<a
										href={`tel:${order.customerPhone}`}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										{order.customerPhone}
									</a>
								</div>
							)}
						</div>
					</div>

					{/* Order Items Section */}
					<div>
						<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
							Objednávka
						</h4>
						<div className="space-y-2">
							{order.orderKind === "christmas_tasting" ? (
								<>
									{order.tastingCakeBoxQty && order.tastingCakeBoxQty > 0 && (
										<div className="bg-pink-50 border border-pink-200 rounded px-3 py-2">
											<div className="flex items-start gap-2">
												<span className="text-lg flex-shrink-0">🎂</span>
												<p className="text-sm font-medium text-pink-900">
													Ochutnávková krabička dortů: {order.tastingCakeBoxQty}
													x
												</p>
											</div>
										</div>
									)}
									{order.tastingSweetbarBoxQty &&
										order.tastingSweetbarBoxQty > 0 && (
											<div className="bg-purple-50 border border-purple-200 rounded px-3 py-2">
												<div className="flex items-start gap-2">
													<span className="text-lg flex-shrink-0">🧁</span>
													<p className="text-sm font-medium text-purple-900">
														Ochutnávková krabička sweetbar:{" "}
														{order.tastingSweetbarBoxQty}x
													</p>
												</div>
											</div>
										)}
									{order.tastingNotes && (
										<div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
											<p className="text-xs text-gray-700 italic">
												Poznámka: {order.tastingNotes}
											</p>
										</div>
									)}
									{order.totalAmount && (
										<div className="bg-green-50 border border-green-200 rounded px-3 py-2">
											<p className="text-sm font-semibold text-green-900">
												Celková částka: {order.totalAmount} Kč
											</p>
										</div>
									)}
								</>
							) : (
								<>
									{order.orderCake && (
										<div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
											<div className="flex items-start gap-2">
												<span className="text-lg flex-shrink-0">🎂</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-blue-900 break-words">
														{order.cakeSize} • {order.cakeFlavor}
													</p>
													{order.cakeMessage && (
														<p className="text-xs text-blue-700 mt-0.5 italic break-words">
															"{order.cakeMessage}"
														</p>
													)}
												</div>
											</div>
										</div>
									)}
									{order.orderDessert && (
										<div className="bg-green-50 border border-green-200 rounded px-3 py-2">
											<div className="flex items-start gap-2">
												<span className="text-lg flex-shrink-0">🧁</span>
												<p className="text-sm font-medium text-green-900 break-words">
													{order.dessertChoice}
												</p>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* Delivery Section */}
				<div>
					<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
						Doručení
					</h4>
					<div
						className={`rounded px-3 py-2 ${isOverdue ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}
					>
						<div className="flex items-center gap-2">
							<svg
								className={`w-4 h-4 flex-shrink-0 ${isOverdue ? "text-red-500" : "text-gray-400"}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm font-medium break-words ${isOverdue ? "text-red-900" : "text-gray-900"}`}
								>
									{format(new Date(order.deliveryDate), "d. MMMM yyyy", {
										locale: cs,
									})}
									<span
										className={`text-xs ml-1 ${isOverdue ? "text-red-700" : "text-gray-600"}`}
									>
										(
										{format(new Date(order.deliveryDate), "EEEE", {
											locale: cs,
										})}
										)
									</span>
								</p>
								<p
									className={`text-xs ${isOverdue ? "text-red-700" : "text-gray-600"}`}
								>
									{(() => {
										const days = differenceInCalendarDays(
											new Date(order.deliveryDate),
											new Date(),
										);
										if (days === 0) return "Dnes";
										if (days === 1) return "Zítra";
										if (days === -1) return "Včera";
										if (days > 0)
											return `Za ${days} ${days < 5 ? "dny" : "dní"}`;
										return `${Math.abs(days)} ${Math.abs(days) === 1 ? "den" : Math.abs(days) < 5 ? "dny" : "dní"} po termínu`;
									})()}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Photos Section */}
				{order.photos && order.photos.length > 0 && (
					<div>
						<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
							Fotografie ({order.photos.length})
						</h4>
						<div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
							{order.photos.slice(0, 5).map((photo, index) => (
								<a
									key={photo.id}
									href={`/photo/${photo.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="group relative aspect-square rounded overflow-hidden bg-gray-100 hover:ring-2 hover:ring-pink-500 transition-all"
								>
									<img
										src={`/photo/${photo.id}`}
										alt={photo.originalName}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
									/>
									{index === 4 && order.photos && order.photos.length > 5 && (
										<div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
											<span className="text-white text-sm font-medium">
												+{order.photos.length - 5}
											</span>
										</div>
									)}
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</li>
	);
}
