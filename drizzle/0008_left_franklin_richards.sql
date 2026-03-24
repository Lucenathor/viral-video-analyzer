CREATE TABLE `inspiration_sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`category` varchar(100) NOT NULL,
	`reelUrl` varchar(500) NOT NULL,
	`platform` enum('tiktok','instagram','other') NOT NULL DEFAULT 'tiktok',
	`categoryIcon` varchar(10) NOT NULL DEFAULT '📌',
	`gradientFrom` varchar(20) NOT NULL DEFAULT '#6C5CE7',
	`gradientTo` varchar(20) NOT NULL DEFAULT '#4834D4',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inspiration_sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `inspiration_sectors_slug_unique` UNIQUE(`slug`)
);
