import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Users table (for admin users)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	name: varchar("name", { length: 255 }).notNull(),
	password: varchar("password", { length: 255 }).notNull(),
	isActive: boolean("is_active").notNull().default(true),
	lastLogin: timestamp("last_login"),
	failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
	lockedUntil: timestamp("locked_until"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable(
	"sessions",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: varchar("token", { length: 255 }).notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		tokenIdx: index("idx_sessions_token").on(table.token),
		userIdIdx: index("idx_sessions_user_id").on(table.userId),
		expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
	}),
);

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

		// Order kind (regular or seasonal)
		orderKind: varchar("order_kind", { length: 50 })
			.notNull()
			.default("regular"),

		// Order type flags
		orderCake: boolean("order_cake").notNull().default(false),
		orderDessert: boolean("order_dessert").notNull().default(false),

		// Cake details
		cakeSize: varchar("cake_size", { length: 100 }),
		cakeFlavor: varchar("cake_flavor", { length: 100 }),
		cakeMessage: text("cake_message"),

		// Dessert details
		dessertChoice: varchar("dessert_choice", { length: 255 }),

		// Seasonal tasting order details
		tastingCakeBoxQty: integer("tasting_cake_box_qty"),
		tastingSweetbarBoxQty: integer("tasting_sweetbar_box_qty"),
		tastingNotes: text("tasting_notes"),

		// Legacy fields (keeping for compatibility)
		shippingAddress: text("shipping_address"),
		billingAddress: text("billing_address"),
		totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),

		paidAt: timestamp("paid_at"),
		deliveredAt: timestamp("delivered_at"),
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

// Blocked dates table
export const blockedDates = pgTable(
	"blocked_dates",
	{
		id: serial("id").primaryKey(),
		date: date("date").notNull().unique(),
		createdById: integer("created_by_id")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		dateIdx: index("idx_blocked_dates_date").on(table.date),
	}),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	createdOrders: many(orders, { relationName: "createdBy" }),
	updatedOrders: many(orders, { relationName: "updatedBy" }),
	sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
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

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
	createdBy: one(users, {
		fields: [blockedDates.createdById],
		references: [users.id],
	}),
}));

// Type exports for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderPhoto = typeof orderPhotos.$inferSelect;
export type NewOrderPhoto = typeof orderPhotos.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type NewBlockedDate = typeof blockedDates.$inferInsert;
