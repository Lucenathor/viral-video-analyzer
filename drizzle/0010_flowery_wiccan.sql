ALTER TABLE `calendar_progress` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `scheduled_stories` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `story_history` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `video_analyses` MODIFY COLUMN `userId` int;