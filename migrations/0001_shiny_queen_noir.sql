PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_likes` (
	`like_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`liked_by` integer NOT NULL,
	`post_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`liked_by`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_likes`("like_id", "liked_by", "post_id", "created_at", "updated_at") SELECT "like_id", "liked_by", "post_id", "created_at", "updated_at" FROM `likes`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
ALTER TABLE `__new_likes` RENAME TO `likes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;