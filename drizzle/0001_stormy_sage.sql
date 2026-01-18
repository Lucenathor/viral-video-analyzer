CREATE TABLE `sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`imageUrl` varchar(500),
	`reelsCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`category` enum('analysis_help','video_review','technical','general') NOT NULL DEFAULT 'general',
	`status` enum('open','in_progress','waiting_response','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`expertResponse` text,
	`loomVideoUrl` varchar(500),
	`respondedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int,
	`isFromSupport` boolean NOT NULL DEFAULT false,
	`message` text NOT NULL,
	`attachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`analysisType` enum('viral_analysis','comparison','expert_review') NOT NULL DEFAULT 'viral_analysis',
	`hookAnalysis` text,
	`structureBreakdown` json,
	`viralityFactors` json,
	`summary` text,
	`comparisonVideoId` int,
	`improvementPoints` json,
	`cutRecommendations` json,
	`editingSuggestions` text,
	`overallScore` int,
	`hookScore` int,
	`pacingScore` int,
	`engagementScore` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sectorId` int,
	`title` varchar(255),
	`description` text,
	`videoUrl` varchar(500) NOT NULL,
	`videoKey` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`duration` int,
	`fileSize` int,
	`mimeType` varchar(100),
	`videoType` enum('viral_reference','user_video','library_example') NOT NULL DEFAULT 'user_video',
	`isPublic` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_videoId_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ticketId_support_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analyses` ADD CONSTRAINT `video_analyses_videoId_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analyses` ADD CONSTRAINT `video_analyses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analyses` ADD CONSTRAINT `video_analyses_comparisonVideoId_videos_id_fk` FOREIGN KEY (`comparisonVideoId`) REFERENCES `videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_sectorId_sectors_id_fk` FOREIGN KEY (`sectorId`) REFERENCES `sectors`(`id`) ON DELETE no action ON UPDATE no action;