CREATE TABLE `story_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sectorId` varchar(100) NOT NULL,
	`sectorCustom` varchar(255),
	`objective` varchar(100) NOT NULL,
	`offer` text,
	`urgencyType` varchar(50) NOT NULL,
	`urgencyValue` varchar(100) NOT NULL,
	`ctaKeyword` varchar(50) NOT NULL,
	`variant` varchar(50) NOT NULL,
	`result` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `story_history` ADD CONSTRAINT `story_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;