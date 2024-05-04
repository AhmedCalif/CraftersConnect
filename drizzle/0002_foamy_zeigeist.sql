CREATE TABLE `users` (
	`id` int NOT NULL,
	`username` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int NOT NULL,
	`description` text NOT NULL,
	`title` text NOT NULL,
	`imageId` int NOT NULL,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int NOT NULL,
	`description` text NOT NULL,
	`title` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`userid` int NOT NULL,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `steps` (
	`id` int NOT NULL,
	`description` text NOT NULL,
	`projectId` int NOT NULL,
	CONSTRAINT `steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collaborator` (
	`id` int NOT NULL,
	`username` text NOT NULL,
	`projectId` int NOT NULL,
	CONSTRAINT `collaborator_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image` (
	`id` int NOT NULL,
	`link` text NOT NULL,
	CONSTRAINT `image_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_imageId_image_id_fk` FOREIGN KEY (`imageId`) REFERENCES `image`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_userid_users_id_fk` FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `steps` ADD CONSTRAINT `steps_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `collaborator` ADD CONSTRAINT `collaborator_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE cascade;