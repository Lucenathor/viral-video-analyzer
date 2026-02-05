CREATE TABLE `calendar_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvedReelId` int NOT NULL,
	`sectorSlug` varchar(100) NOT NULL,
	`dayOfMonth` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`orderInDay` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_billing_type` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billingType` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`startMonth` int,
	`startYear` int,
	`endMonth` int,
	`endYear` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_billing_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_billing_type_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `calendar_assignments` ADD CONSTRAINT `calendar_assignments_approvedReelId_approved_reels_id_fk` FOREIGN KEY (`approvedReelId`) REFERENCES `approved_reels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_billing_type` ADD CONSTRAINT `subscription_billing_type_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;