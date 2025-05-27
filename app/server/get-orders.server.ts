// Dynamic imports to ensure server-only execution

import {
	type SQL,
	and,
	asc,
	count,
	desc as descFn,
	eq,
	ilike,
	or,
} from "drizzle-orm";
import { db, orderPhotos, orders } from "../db";

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
	status: "created" | "paid" | "delivered";
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
		// static imports used

		const ordersData = await db
			.select()
			.from(orders)
			.orderBy(descFn(orders.createdAt));

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

export type SortField =
	| "createdAt"
	| "deliveryDate"
	| "orderNumber"
	| "customerName"
	| "status";

export interface OrdersQueryOptions {
	status?: "created" | "paid" | "delivered" | "all";
	sort?: SortField;
	dir?: "asc" | "desc";
	search?: string;
	limit: number;
	offset: number;
}

export async function getOrdersPaged({
	status = "all",
	sort = "createdAt",
	dir = "desc",
	search = "",
	limit,
	offset,
}: OrdersQueryOptions): Promise<{ orders: OrderWithPhotos[]; total: number }> {
	try {
		const conditions: SQL[] = [];
		if (status !== "all") {
			conditions.push(eq(orders.status, status));
		}

		if (search.trim()) {
			const pattern = `%${search.trim()}%`;
			const searchCondition = or(
				ilike(orders.orderNumber, pattern) as SQL,
				ilike(orders.customerName, pattern) as SQL,
				ilike(orders.customerEmail, pattern) as SQL,
			);
			conditions.push(searchCondition as SQL);
		}

		const whereCondition = conditions.length ? and(...conditions) : undefined;

		// Total count before pagination
		const totalResultQuery = db.select({ c: count() }).from(orders);
		const totalResult = whereCondition
			? await totalResultQuery.where(whereCondition)
			: await totalResultQuery;

		const total = totalResult[0]?.c ?? 0;

		// Sorting
		const sortColumn = (() => {
			switch (sort) {
				case "deliveryDate":
					return orders.deliveryDate;
				case "orderNumber":
					return orders.orderNumber;
				case "customerName":
					return orders.customerName;
				case "status":
					return orders.status;
				default:
					return orders.createdAt;
			}
		})();

		const orderByExpr = dir === "asc" ? asc(sortColumn) : descFn(sortColumn);

		// Query orders with pagination
		const ordersQuery = whereCondition
			? db
					.select()
					.from(orders)
					.where(whereCondition as SQL)
			: db.select().from(orders);

		const ordersData = await ordersQuery
			.orderBy(orderByExpr)
			.limit(limit)
			.offset(offset);

		// Fetch photos for these orders
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
				} as OrderWithPhotos;
			}),
		);

		return { orders: ordersWithPhotos, total };
	} catch (error) {
		console.error("Error fetching paged orders:", error);
		return { orders: [], total: 0 };
	}
}
