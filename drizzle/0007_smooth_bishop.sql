ALTER TABLE "orders" ADD COLUMN "order_kind" varchar(50) DEFAULT 'regular' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tasting_cake_box_qty" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tasting_sweetbar_box_qty" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tasting_notes" text;