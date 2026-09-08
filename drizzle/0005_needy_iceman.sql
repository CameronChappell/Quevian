CREATE TABLE `automation_events` (
	`org_id` text NOT NULL,
	`key` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`org_id`, `key`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `board_settings` (
	`org_id` text NOT NULL,
	`board_id` text NOT NULL,
	`default_member_id` text,
	`email` text DEFAULT '' NOT NULL,
	`labels` text NOT NULL,
	`targets` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `board_id`),
	FOREIGN KEY (`org_id`,`board_id`) REFERENCES `boards`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`default_member_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contact_assets` (
	`org_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`asset_id` text NOT NULL,
	PRIMARY KEY(`org_id`, `contact_id`, `asset_id`),
	FOREIGN KEY (`org_id`,`contact_id`) REFERENCES `contacts`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`asset_id`) REFERENCES `assets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `delivery_templates` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`company_id` text NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`visibility` text NOT NULL,
	`author_id` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `document_company` ON `documents` (`org_id`,`company_id`);--> statement-breakpoint
CREATE INDEX `document_project` ON `documents` (`org_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`project_id` text NOT NULL,
	`vendor` text NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`currency` text NOT NULL,
	`items` text NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_project` ON `purchases` (`org_id`,`project_id`);
--> statement-breakpoint
CREATE TRIGGER document_company_guard BEFORE INSERT ON documents WHEN NEW.project_id IS NOT NULL BEGIN
 SELECT RAISE(ABORT,'document_company') WHERE NOT EXISTS(SELECT 1 FROM projects WHERE org_id=NEW.org_id AND id=NEW.project_id AND company_id=NEW.company_id);
END;
--> statement-breakpoint
CREATE TRIGGER project_document_move_guard BEFORE UPDATE ON projects WHEN NEW.company_id<>OLD.company_id BEGIN
 SELECT RAISE(ABORT,'document_company') WHERE EXISTS(SELECT 1 FROM documents WHERE org_id=NEW.org_id AND project_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER contact_asset_company_guard BEFORE INSERT ON contact_assets BEGIN
 SELECT RAISE(ABORT,'contact_asset') WHERE NOT EXISTS(SELECT 1 FROM contacts c JOIN assets a ON a.org_id=c.org_id AND a.company_id=c.company_id WHERE c.org_id=NEW.org_id AND c.id=NEW.contact_id AND a.id=NEW.asset_id);
END;
--> statement-breakpoint
CREATE TRIGGER contact_asset_contact_move_guard BEFORE UPDATE ON contacts WHEN NEW.company_id<>OLD.company_id BEGIN
 SELECT RAISE(ABORT,'contact_asset') WHERE EXISTS(SELECT 1 FROM contact_assets WHERE org_id=NEW.org_id AND contact_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER contact_asset_asset_move_guard BEFORE UPDATE ON assets WHEN NEW.company_id<>OLD.company_id BEGIN
 SELECT RAISE(ABORT,'contact_asset') WHERE EXISTS(SELECT 1 FROM contact_assets WHERE org_id=NEW.org_id AND asset_id=NEW.id);
END;

--> statement-breakpoint
CREATE TRIGGER extended_notification_preferences BEFORE INSERT ON notifications WHEN EXISTS(SELECT 1 FROM preferences p WHERE p.org_id=NEW.org_id AND p.user_id=NEW.user_id AND ((NEW.title LIKE 'Project update:%' AND json_extract(p.data,'$.projects')=0) OR ((NEW.title LIKE 'SLA %' OR NEW.title LIKE 'Ticket inactive:%') AND json_extract(p.data,'$.sla')=0) OR (NEW.title LIKE 'Mentioned in ticket%' AND json_extract(p.data,'$.mentions')=0))) BEGIN
 SELECT RAISE(IGNORE);
END;
