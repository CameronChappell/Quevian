CREATE TABLE `assets` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`manufacturer` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`serial` text DEFAULT '' NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`mac` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`purchased` text DEFAULT '' NOT NULL,
	`warranty` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`visible` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `asset_company` ON `assets` (`org_id`,`company_id`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`at` text NOT NULL,
	`visibility` text NOT NULL,
	`author_id` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`trigger_type` text NOT NULL,
	`priority` text DEFAULT '' NOT NULL,
	`board_id` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`actions` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`email` text NOT NULL,
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_grant` ON `customer_grants` (`org_id`,`company_id`,`email`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`ticket_id` integer,
	`title` text NOT NULL,
	`at` text NOT NULL,
	`read` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notification_user` ON `notifications` (`org_id`,`user_id`,`read`,`at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`owner_id` text,
	`status` text NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`estimated_hours` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`owner_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `public_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`kind` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `message_ticket` ON `public_messages` (`org_id`,`ticket_id`,`at`);--> statement-breakpoint
CREATE TABLE `scheduled_work` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer,
	`member_id` text NOT NULL,
	`title` text NOT NULL,
	`starts` text NOT NULL,
	`ends` text NOT NULL,
	`kind` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`cancelled` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`member_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `schedule_member` ON `scheduled_work` (`org_id`,`member_id`,`starts`);--> statement-breakpoint
CREATE TABLE `sla_policies` (
	`org_id` text NOT NULL,
	`priority` text NOT NULL,
	`response_minutes` integer NOT NULL,
	`resolution_minutes` integer NOT NULL,
	`enabled` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `priority`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`member_id` text,
	`due` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`member_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticket_links` (
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`project_id` text,
	`asset_id` text,
	PRIMARY KEY(`org_id`, `ticket_id`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`asset_id`) REFERENCES `assets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text NOT NULL,
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`starts` text NOT NULL,
	`ends` text NOT NULL,
	`minutes` integer NOT NULL,
	`description` text NOT NULL,
	`billable` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `time_user` ON `time_entries` (`org_id`,`user_id`,`starts`);--> statement-breakpoint
CREATE TABLE `running_timers` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`started` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `response_due` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `resolution_due` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `responded` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `resolved` text;--> statement-breakpoint
CREATE TRIGGER schedule_no_overlap_insert BEFORE INSERT ON scheduled_work WHEN NEW.cancelled=0 BEGIN
 SELECT RAISE(ABORT,'schedule_overlap') WHERE EXISTS(SELECT 1 FROM scheduled_work s WHERE s.org_id=NEW.org_id AND s.member_id=NEW.member_id AND s.cancelled=0 AND s.starts<NEW.ends AND s.ends>NEW.starts);
END;
--> statement-breakpoint
CREATE TRIGGER schedule_no_overlap_update BEFORE UPDATE ON scheduled_work WHEN NEW.cancelled=0 BEGIN
 SELECT RAISE(ABORT,'schedule_overlap') WHERE EXISTS(SELECT 1 FROM scheduled_work s WHERE s.org_id=NEW.org_id AND s.member_id=NEW.member_id AND s.id<>NEW.id AND s.cancelled=0 AND s.starts<NEW.ends AND s.ends>NEW.starts);
END;
--> statement-breakpoint
CREATE TRIGGER time_no_overlap_insert BEFORE INSERT ON time_entries BEGIN
 SELECT RAISE(ABORT,'time_overlap') WHERE EXISTS(SELECT 1 FROM time_entries t WHERE t.org_id=NEW.org_id AND t.user_id=NEW.user_id AND t.starts<NEW.ends AND t.ends>NEW.starts);
END;
--> statement-breakpoint
CREATE TRIGGER time_no_overlap_update BEFORE UPDATE ON time_entries BEGIN
 SELECT RAISE(ABORT,'time_overlap') WHERE EXISTS(SELECT 1 FROM time_entries t WHERE t.org_id=NEW.org_id AND t.user_id=NEW.user_id AND t.id<>NEW.id AND t.starts<NEW.ends AND t.ends>NEW.starts);
END;
