CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`instagramReach` int NOT NULL DEFAULT 0,
	`totalReach` int NOT NULL DEFAULT 0,
	`totalImpressions` int NOT NULL DEFAULT 0,
	`instagramProfileVisits` int NOT NULL DEFAULT 0,
	`newInstagramFollowers` int NOT NULL DEFAULT 0,
	`messagesInitiated` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalClicks` int NOT NULL DEFAULT 0,
	`costPerClick` decimal(10,2) NOT NULL DEFAULT '0.00',
	`videoRetentionRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`profileVisitsThroughCampaigns` int NOT NULL DEFAULT 0,
	`costPerProfileVisit` decimal(10,2) NOT NULL DEFAULT '0.00',
	`cpm` decimal(10,2) NOT NULL DEFAULT '0.00',
	`ctr` decimal(5,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`isPublished` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_slug_unique` UNIQUE(`slug`)
);
