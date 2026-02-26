CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" jsonb DEFAULT '{"en":"","uz":"","ru":""}'::jsonb NOT NULL,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" jsonb DEFAULT '{"en":"","uz":"","ru":""}'::jsonb NOT NULL,
	"slug" varchar(255) NOT NULL,
	"image_url" text DEFAULT '/uploads/placeholder.jpg' NOT NULL,
	"parent_id" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" jsonb DEFAULT '{"en":"","uz":"","ru":""}'::jsonb NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" jsonb DEFAULT '{"en":"","uz":"","ru":""}'::jsonb NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category_id" varchar(100) NOT NULL,
	"brand_id" varchar(100) NOT NULL,
	"material" jsonb DEFAULT '{"en":"","uz":"","ru":""}'::jsonb,
	"weight" varchar(100),
	"in_stock" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "store_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" varchar(255) DEFAULT 'Luxe Store' NOT NULL,
	"hero_enabled" boolean DEFAULT true NOT NULL,
	"hero_title" jsonb DEFAULT '{"en":"Timeless Elegance","uz":"","ru":""}'::jsonb NOT NULL,
	"hero_subtitle" jsonb DEFAULT '{"en":"Discover our curated collection.","uz":"","ru":""}'::jsonb NOT NULL,
	"hero_cta_text" jsonb DEFAULT '{"en":"Shop Collection","uz":"","ru":""}'::jsonb NOT NULL,
	"hero_cta_link" varchar(255) DEFAULT '/catalog' NOT NULL,
	"hero_image_url" text DEFAULT '/uploads/hero-jewelry.jpg' NOT NULL,
	"footer_text" jsonb DEFAULT '{"en":"Fine products crafted with passion.","uz":"","ru":""}'::jsonb NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"locale" varchar(20) DEFAULT 'en-US' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
