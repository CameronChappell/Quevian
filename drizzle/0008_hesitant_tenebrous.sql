CREATE TABLE `mail_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`status` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mail_events_provider` ON `mail_events` (`provider_id`,`at`);--> statement-breakpoint
CREATE TABLE `mail_inbound` (
	`provider_id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mail_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`company_id` text NOT NULL,
	`recipient` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_id` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mail_outbox_org` ON `mail_outbox` (`org_id`,`ticket_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mail_provider_id` ON `mail_outbox` (`provider_id`);--> statement-breakpoint
CREATE TABLE `mail_routes` (
	`address` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`board_id` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`board_id`) REFERENCES `boards`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mail_routes_org` ON `mail_routes` (`org_id`);--> statement-breakpoint
CREATE TABLE `mail_threads` (
	`address` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`company_id` text NOT NULL,
	`requester` text NOT NULL,
	`message_id` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mail_thread_ticket` ON `mail_threads` (`org_id`,`ticket_id`);