CREATE TABLE `legal_acceptances` (
	`user_id` text NOT NULL,
	`terms_version` text NOT NULL,
	`privacy_version` text NOT NULL,
	`accepted_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `terms_version`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
