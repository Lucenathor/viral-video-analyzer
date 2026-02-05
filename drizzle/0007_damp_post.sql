ALTER TABLE `approved_reels` MODIFY COLUMN `tiktokId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `candidate_reels` MODIFY COLUMN `tiktokId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `labeled_reels` MODIFY COLUMN `tiktokId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `pending_reels` MODIFY COLUMN `tiktokId` varchar(255) NOT NULL;