import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Enums
export const orderStatusEnum = pgEnum("order_status", [
	"created",
	"paid",
	"delivered",
]);

// Users table (for admin users)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	name: varchar("name", { length: 255 }).notNull(),
	password: varchar("password", { length: 255 }).notNull(),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable(
	"orders",
	{
		id: serial("id").primaryKey(),
		orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
		customerName: varchar("customer_name", { length: 255 }).notNull(),
		customerEmail: varchar("customer_email", { length: 255 }).notNull(),
		customerPhone: varchar("customer_phone", { length: 50 }),
		deliveryDate: timestamp("delivery_date").notNull(),

		// Order type flags
		orderCake: boolean("order_cake").notNull().default(false),
		orderDessert: boolean("order_dessert").notNull().default(false),

		// Cake details
		cakeSize: varchar("cake_size", { length: 100 }),
		cakeFlavor: varchar("cake_flavor", { length: 100 }),
		cakeMessage: text("cake_message"),

		// Dessert details
		dessertChoice: varchar("dessert_choice", { length: 255 }),

		// Legacy fields (keeping for compatibility)
		shippingAddress: text("shipping_address"),
		billingAddress: text("billing_address"),
		totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),

		status: orderStatusEnum("status").notNull().default("created"),
		notes: text("notes"),
		createdById: integer("created_by_id").references(() => users.id),
		updatedById: integer("updated_by_id").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => ({
		orderNumberTrgmIdx: index("orders_order_number_trgm").on(table.orderNumber),
		customerNameTrgmIdx: index("orders_customer_name_trgm").on(
			table.customerName,
		),
		customerEmailTrgmIdx: index("orders_customer_email_trgm").on(
			table.customerEmail,
		),
	}),
);

// Order photos table
export const orderPhotos = pgTable("order_photos", {
	id: serial("id").primaryKey(),
	orderId: integer("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	originalName: varchar("original_name", { length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	fileSize: integer("file_size").notNull(), // in bytes
	imageData: text("image_data").notNull(), // base64 encoded binary data
	uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	createdOrders: many(orders, { relationName: "createdBy" }),
	updatedOrders: many(orders, { relationName: "updatedBy" }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [orders.createdById],
		references: [users.id],
		relationName: "createdBy",
	}),
	updatedBy: one(users, {
		fields: [orders.updatedById],
		references: [users.id],
		relationName: "updatedBy",
	}),
	photos: many(orderPhotos),
}));

export const orderPhotosRelations = relations(orderPhotos, ({ one }) => ({
	order: one(orders, {
		fields: [orderPhotos.orderId],
		references: [orders.id],
	}),
}));

// Type exports for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderPhoto = typeof orderPhotos.$inferSelect;
export type NewOrderPhoto = typeof orderPhotos.$inferInsert;
