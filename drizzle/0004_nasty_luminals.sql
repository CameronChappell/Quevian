CREATE TABLE `company_locations` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_company_id` ON `company_locations` (`org_id`,`company_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `location_company_name` ON `company_locations` (`org_id`,`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `contact_profiles` (
	`org_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`mobile` text DEFAULT '' NOT NULL,
	`preferred` text DEFAULT 'Email' NOT NULL,
	`location_id` text,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `contact_id`),
	FOREIGN KEY (`org_id`,`contact_id`) REFERENCES `contacts`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`location_id`) REFERENCES `company_locations`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`member_id` text,
	`completed` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`member_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `milestone_project` ON `milestones` (`org_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `project_expenses` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`project_id` text NOT NULL,
	`description` text NOT NULL,
	`vendor` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_project` ON `project_expenses` (`org_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `project_plans` (
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`budget_cents` integer DEFAULT 0 NOT NULL,
	`labor_rate_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `project_id`),
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TRIGGER contact_profile_location_insert BEFORE INSERT ON contact_profiles WHEN NEW.location_id IS NOT NULL BEGIN
 SELECT RAISE(ABORT,'contact_location') WHERE NOT EXISTS(SELECT 1 FROM contacts c JOIN company_locations l ON l.org_id=c.org_id AND l.company_id=c.company_id WHERE c.org_id=NEW.org_id AND c.id=NEW.contact_id AND l.id=NEW.location_id);
END;

--> statement-breakpoint
CREATE TRIGGER contact_profile_location_update BEFORE UPDATE ON contact_profiles WHEN NEW.location_id IS NOT NULL BEGIN
 SELECT RAISE(ABORT,'contact_location') WHERE NOT EXISTS(SELECT 1 FROM contacts c JOIN company_locations l ON l.org_id=c.org_id AND l.company_id=c.company_id WHERE c.org_id=NEW.org_id AND c.id=NEW.contact_id AND l.id=NEW.location_id);
END;

--> statement-breakpoint
CREATE TRIGGER contact_move_location_guard BEFORE UPDATE ON contacts WHEN NEW.company_id<>OLD.company_id BEGIN
 SELECT RAISE(ABORT,'contact_location') WHERE EXISTS(SELECT 1 FROM contact_profiles WHERE org_id=NEW.org_id AND contact_id=NEW.id AND location_id IS NOT NULL);
END;
--> statement-breakpoint
CREATE TRIGGER project_plan_currency_guard BEFORE UPDATE ON project_plans WHEN NEW.currency<>OLD.currency BEGIN
 SELECT RAISE(ABORT,'plan_currency') WHERE EXISTS(SELECT 1 FROM project_expenses WHERE org_id=NEW.org_id AND project_id=NEW.project_id);
END;
