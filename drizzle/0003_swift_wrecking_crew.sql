CREATE TABLE `calendar_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sectorId` varchar(100) NOT NULL,
	`videoId` varchar(100) NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyHistoryId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calendar_progress` ADD CONSTRAINT `calendar_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduled_stories` ADD CONSTRAINT `scheduled_stories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduled_stories` ADD CONSTRAINT `scheduled_stories_storyHistoryId_story_history_id_fk` FOREIGN KEY (`storyHistoryId`) REFERENCES `story_history`(`id`) ON DELETE no action ON UPDATE no action;