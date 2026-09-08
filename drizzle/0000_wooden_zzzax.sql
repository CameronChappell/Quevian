CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`author_id` text NOT NULL,
	`before` text,
	`after` text,
	`at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_entity` ON `audit_events` (`org_id`,`entity_id`,`at`);--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`statuses` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `board_name` ON `boards` (`org_id`,`name`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_name` ON `companies` (`org_id`,`name`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contact_company_key` ON `contacts` (`org_id`,`company_id`,`id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`expires` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invitation_role" CHECK("invitations"."role" IN ('Administrator','Manager','Engineer','Viewer'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_email` ON `invitations` (`org_id`,`email`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "membership_role" CHECK("memberships"."role" IN ('Owner','Administrator','Manager','Engineer','Viewer'))
);
--> statement-breakpoint
CREATE TABLE `ticket_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `note_ticket` ON `ticket_notes` (`org_id`,`ticket_id`,`at`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`contact_id` text,
	`board_id` text NOT NULL,
	`assignee_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL,
	`priority` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`company_id`,`contact_id`) REFERENCES `contacts`(`org_id`,`company_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`board_id`) REFERENCES `boards`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`assignee_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ticket_priority" CHECK("tickets"."priority" IN ('Critical','High','Normal','Low'))
);
--> statement-breakpoint
CREATE INDEX `ticket_queue` ON `tickets` (`org_id`,`closed`,`updated`);--> statement-breakpoint
CREATE INDEX `ticket_assignee` ON `tickets` (`org_id`,`assignee_id`,`closed`);--> statement-breakpoint
CREATE INDEX `ticket_board` ON `tickets` (`org_id`,`board_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL
);
