CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportMetrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"reportId" integer NOT NULL,
	"instagramReach" integer DEFAULT 0 NOT NULL,
	"totalReach" integer DEFAULT 0 NOT NULL,
	"totalImpressions" integer DEFAULT 0 NOT NULL,
	"instagramProfileVisits" integer DEFAULT 0 NOT NULL,
	"newInstagramFollowers" integer DEFAULT 0 NOT NULL,
	"messagesInitiated" integer DEFAULT 0 NOT NULL,
	"totalSpent" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"totalClicks" integer DEFAULT 0 NOT NULL,
	"costPerClick" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"videoRetentionRate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"profileVisitsThroughCampaigns" integer DEFAULT 0 NOT NULL,
	"costPerProfileVisit" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"cpm" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"ctr" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"isPublished" text DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
