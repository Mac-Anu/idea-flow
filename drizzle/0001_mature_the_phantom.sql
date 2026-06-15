CREATE TABLE "article_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rbac_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"action" text NOT NULL,
	"subject" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"conditions" jsonb,
	"inverted" boolean DEFAULT false NOT NULL,
	"systemed" boolean DEFAULT false NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rbac_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rbac_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"systemed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rbac_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "embedding" vector(1024);--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "article_chunks" ADD CONSTRAINT "article_chunks_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_code" ADD CONSTRAINT "invitation_code_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_rbac_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_rbac_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."rbac_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_rbac_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."rbac_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_rbac_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE cascade ON UPDATE no action;