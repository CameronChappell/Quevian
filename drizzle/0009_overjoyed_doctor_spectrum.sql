CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_runs` (
	`name` text PRIMARY KEY NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`token` text DEFAULT '' NOT NULL,
	`cursor` text DEFAULT '' NOT NULL,
	`last_started` text DEFAULT '' NOT NULL,
	`last_completed` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`error` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mail_attachment_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`company_id` text NOT NULL,
	`author_id` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `mail_inbound`(`provider_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mail_attachment_pending` ON `mail_attachment_imports` (`status`,`updated`);--> statement-breakpoint
CREATE UNIQUE INDEX `mail_attachment_provider` ON `mail_attachment_imports` (`provider_id`,`attachment_id`);--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `privacy_request_org` ON `privacy_requests` (`org_id`,`created`);--> statement-breakpoint
CREATE TABLE `workspace_subscriptions` (
	`org_id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`subscription_id` text,
	`status` text DEFAULT 'unconfigured' NOT NULL,
	`seats` integer DEFAULT 0 NOT NULL,
	`interval` text DEFAULT 'monthly' NOT NULL,
	`price_id` text,
	`period_end` integer,
	`cancel_at_period_end` integer DEFAULT 0 NOT NULL,
	`checkout_id` text,
	`checkout_expires` integer,
	`updated` text NOT NULL,
	`event_created` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_customer` ON `workspace_subscriptions` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_provider` ON `workspace_subscriptions` (`subscription_id`);