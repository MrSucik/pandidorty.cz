-- Enable pg_trgm extension for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
-- Remove all existing orders to avoid enum conflicts
DELETE FROM "orders";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'created'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'paid', 'delivered');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'created'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
CREATE INDEX "orders_order_number_trgm" ON "orders" USING gin ("order_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "orders_customer_name_trgm" ON "orders" USING gin ("customer_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "orders_customer_email_trgm" ON "orders" USING gin ("customer_email" gin_trgm_ops);