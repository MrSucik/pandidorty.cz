// Dynamic imports to ensure server-only execution
import { createServerFn } from "@tanstack/react-start";

export interface OrderWithPhotos {
	id: number;
	orderNumber: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string | null;
	deliveryDate: string;
	orderCake: boolean;
	orderDessert: boolean;
	cakeSize: string | null;
	cakeFlavor: string | null;
	cakeMessage: string | null;
	dessertChoice: string | null;
	status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
	createdAt: string;
	photos?: Photo[];
}

export interface Photo {
	id: number;
	originalName: string;
	mimeType: string;
	fileSize: number;
	uploadedAt: string;
}

export async function getAllOrders(): Promise<OrderWithPhotos[]> {
	try {
		const { db, orders, orderPhotos } = await import("../db");
		const { eq, desc } = await import("drizzle-orm");

		const ordersData = await db
			.select()
			.from(orders)
			.orderBy(desc(orders.createdAt));

		// Get photos for all orders in parallel
		const ordersWithPhotos = await Promise.all(
			ordersData.map(async (order) => {
				const photos = await db
					.select({
						id: orderPhotos.id,
						originalName: orderPhotos.originalName,
						mimeType: orderPhotos.mimeType,
						fileSize: orderPhotos.fileSize,
						uploadedAt: orderPhotos.uploadedAt,
					})
					.from(orderPhotos)
					.where(eq(orderPhotos.orderId, order.id));

				return {
					...order,
					deliveryDate: order.deliveryDate.toISOString(),
					createdAt: order.createdAt.toISOString(),
					photos: photos.map((photo) => ({
						...photo,
						uploadedAt: photo.uploadedAt.toISOString(),
					})),
				};
			}),
		);

		return ordersWithPhotos;
	} catch (error) {
		console.error("Error fetching orders:", error);
		return [];
	}
}

export async function getOrderByNumber(
	orderNumber: string,
): Promise<OrderWithPhotos | null> {
	try {
		const { db, orders, orderPhotos } = await import("../db");
		const { eq } = await import("drizzle-orm");

		const orderData = await db
			.select()
			.from(orders)
			.where(eq(orders.orderNumber, orderNumber))
			.limit(1);

		if (!orderData[0]) {
			return null;
		}

		const order = orderData[0];

		// Get photos for this order
		const photos = await db
			.select({
				id: orderPhotos.id,
				originalName: orderPhotos.originalName,
				mimeType: orderPhotos.mimeType,
				fileSize: orderPhotos.fileSize,
				uploadedAt: orderPhotos.uploadedAt,
			})
			.from(orderPhotos)
			.where(eq(orderPhotos.orderId, order.id));

		return {
			...order,
			deliveryDate: order.deliveryDate.toISOString(),
			createdAt: order.createdAt.toISOString(),
			photos: photos.map((photo) => ({
				...photo,
				uploadedAt: photo.uploadedAt.toISOString(),
			})),
		};
	} catch (error) {
		console.error("Error fetching order by number:", error);
		return null;
	}
}

// TanStack Start server functions
export const getOrdersFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const orders = await getAllOrders();
	return { orders };
});

export const getOrderByNumberFn = createServerFn({
	method: "GET",
})
	.validator((orderNumber: string) => orderNumber)
	.handler(async ({ data: orderNumber }) => {
		const order = await getOrderByNumber(orderNumber);
		return order;
	});
