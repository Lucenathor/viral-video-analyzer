CREATE TABLE `approved_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pendingReelId` int,
	`tiktokId` varchar(100) NOT NULL,
	`tiktokUrl` varchar(500) NOT NULL,
	`authorUsername` varchar(100),
	`authorName` varchar(255),
	`title` text,
	`description` text,
	`coverUrl` varchar(500),
	`videoUrl` varchar(500),
	`duration` int,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`sectorSlug` varchar(100) NOT NULL,
	`viralityExplanation` text,
	`teachingPoints` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`approvedBy` int,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approved_reels_id` PRIMARY KEY(`id`),
	CONSTRAINT `approved_reels_tiktokId_unique` UNIQUE(`tiktokId`)
);
--> statement-breakpoint
CREATE TABLE `pending_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tiktokId` varchar(100) NOT NULL,
	`tiktokUrl` varchar(500) NOT NULL,
	`authorUsername` varchar(100),
	`authorName` varchar(255),
	`title` text,
	`description` text,
	`coverUrl` varchar(500),
	`videoUrl` varchar(500),
	`duration` int,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`suggestedSector` varchar(100),
	`viralityExplanation` text,
	`viralityScore` int,
	`contentAnalysis` json,
	`hashtags` json,
	`searchQuery` varchar(255),
	`foundAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`assignedSector` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pending_reels_id` PRIMARY KEY(`id`),
	CONSTRAINT `pending_reels_tiktokId_unique` UNIQUE(`tiktokId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','canceled','past_due','trialing','incomplete') NOT NULL DEFAULT 'incomplete',
	`plan` enum('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
	`analysisCount` int NOT NULL DEFAULT 0,
	`storiesCount` int NOT NULL DEFAULT 0,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `approved_reels` ADD CONSTRAINT `approved_reels_pendingReelId_pending_reels_id_fk` FOREIGN KEY (`pendingReelId`) REFERENCES `pending_reels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approved_reels` ADD CONSTRAINT `approved_reels_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_reels` ADD CONSTRAINT `pending_reels_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;