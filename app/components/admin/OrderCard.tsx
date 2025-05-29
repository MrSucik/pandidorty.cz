import {
	format,
	formatDistanceToNow,
	differenceInCalendarDays,
} from "date-fns";
import { cs } from "date-fns/locale";
import type { OrderWithPhotos } from "../../server/get-orders.server";

interface Props {
	order: OrderWithPhotos;
}

export default function OrderCard({ order }: Props) {
	return (
		<li className="bg-white shadow rounded-md p-4 sm:p-6">
			{/* Header */}
			<div className="flex items-start justify-between flex-wrap gap-y-2">
				<p className="text-base font-semibold text-pink-600">
					{order.orderNumber}
				</p>
				{/* Always show both delivered and paid status */}
				<div className="text-xs space-y-1">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-700">Doručeno:</span>
						{order.deliveredAt ? (
							<span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
								{format(new Date(order.deliveredAt), "dd.MM.yyyy")}
								{" ("}
								{formatDistanceToNow(new Date(order.deliveredAt), {
									addSuffix: true,
									locale: cs,
								})}
								{")"}
							</span>
						) : (
							<span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
								Ne
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-700">Zaplaceno:</span>
						{order.paidAt ? (
							<span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
								{format(new Date(order.paidAt), "dd.MM.yyyy")}
								{" ("}
								{formatDistanceToNow(new Date(order.paidAt), {
									addSuffix: true,
									locale: cs,
								})}
								{")"}
							</span>
						) : (
							<span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
								Ne
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Customer info */}
			<div className="mt-4 text-sm text-gray-700 space-y-1">
				<p>
					<span className="font-medium">Zákazník:</span> {order.customerName}
				</p>
				<p>
					<span className="font-medium">Email:</span> {order.customerEmail}
				</p>
				{order.customerPhone && (
					<p>
						<span className="font-medium">Telefon:</span> {order.customerPhone}
					</p>
				)}
			</div>

			{/* Order items */}
			<div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2 flex-wrap">
				{order.orderCake && (
					<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-medium">
						🎂 Dort – {order.cakeSize}, {order.cakeFlavor}
						{order.cakeMessage ? ` – "${order.cakeMessage}"` : ""}
					</span>
				)}
				{order.orderDessert && (
					<span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium">
						🧁 Dezerty – {order.dessertChoice}
					</span>
				)}
			</div>

			{/* Delivery & other */}
			<div className="mt-4 text-sm text-gray-700 space-y-1">
				<p>
					<span className="font-medium">Doručení:</span>{" "}
					{format(new Date(order.deliveryDate), "dd.MM.yyyy (EEEE)", {
						locale: cs,
					})}
					{(() => {
						const days = differenceInCalendarDays(
							new Date(order.deliveryDate),
							new Date(),
						);
						if (days === 0)
							return <span className="ml-2 text-xs text-gray-500">(dnes)</span>;
						if (days > 0)
							return (
								<span className="ml-2 text-xs text-gray-500">
									(za {days} {days === 1 ? "den" : days < 5 ? "dny" : "dní"})
								</span>
							);
						return (
							<span className="ml-2 text-xs text-gray-500">
								({Math.abs(days)}{" "}
								{Math.abs(days) === 1
									? "den"
									: Math.abs(days) < 5
										? "dny"
										: "dní"}{" "}
								po termínu)
							</span>
						);
					})()}
				</p>
				<p>
					<span className="font-medium">Vytvořeno:</span>{" "}
					{format(new Date(order.createdAt), "dd.MM.yyyy HH:mm", {
						locale: cs,
					})}
					{(() => {
						const days = differenceInCalendarDays(
							new Date(),
							new Date(order.createdAt),
						);
						if (days === 0)
							return <span className="ml-2 text-xs text-gray-500">(dnes)</span>;
						return (
							<span className="ml-2 text-xs text-gray-500">
								({days} {days === 1 ? "den" : days < 5 ? "dny" : "dní"} zpět)
							</span>
						);
					})()}
				</p>
				{order.photos && order.photos.length > 0 && (
					<div className="pt-2">
						<span className="font-medium text-gray-700 block mb-1">
							Fotografie:
						</span>
						<div className="flex flex-wrap gap-2">
							{order.photos.map((photo) => (
								<a
									key={photo.id}
									href={`/photo/${photo.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="block w-24 h-24 border rounded overflow-hidden"
								>
									<img
										src={`/photo/${photo.id}`}
										alt={photo.originalName}
										className="w-full h-full object-cover"
									/>
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</li>
	);
}
