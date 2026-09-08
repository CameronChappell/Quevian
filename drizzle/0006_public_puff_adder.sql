CREATE TABLE `api_keys` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`hash` text NOT NULL,
	`scope` text NOT NULL,
	`expires` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_hash` ON `api_keys` (`hash`);--> statement-breakpoint
CREATE TABLE `invoice_payments` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`reference` text NOT NULL,
	`author_id` text NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`invoice_id`) REFERENCES `invoices`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_invoice` ON `invoice_payments` (`org_id`,`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`company_id` text NOT NULL,
	`project_id` text,
	`reference` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`issued` text NOT NULL,
	`due` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`,`company_id`) REFERENCES `companies`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`project_id`) REFERENCES `projects`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoice_project` ON `invoices` (`org_id`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_reference` ON `invoices` (`org_id`,`reference`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`org_id` text NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`org_id`, `team_id`, `user_id`),
	FOREIGN KEY (`org_id`,`team_id`) REFERENCES `teams`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_name` ON `teams` (`org_id`,`name`);--> statement-breakpoint
CREATE TRIGGER invoice_project_guard BEFORE INSERT ON invoices
WHEN NEW.project_id IS NOT NULL
BEGIN
 SELECT RAISE(ABORT,'invoice_company_currency') WHERE NOT EXISTS(SELECT 1 FROM projects p JOIN project_plans f ON f.org_id=p.org_id AND f.project_id=p.id WHERE p.org_id=NEW.org_id AND p.id=NEW.project_id AND p.company_id=NEW.company_id AND f.currency=NEW.currency);
END;
--> statement-breakpoint
CREATE TRIGGER invoice_project_update_guard BEFORE UPDATE ON invoices
WHEN NEW.project_id IS NOT NULL
BEGIN
 SELECT RAISE(ABORT,'invoice_company_currency') WHERE NOT EXISTS(SELECT 1 FROM projects p JOIN project_plans f ON f.org_id=p.org_id AND f.project_id=p.id WHERE p.org_id=NEW.org_id AND p.id=NEW.project_id AND p.company_id=NEW.company_id AND f.currency=NEW.currency);
END;
--> statement-breakpoint
CREATE TRIGGER invoice_project_move_guard BEFORE UPDATE OF company_id ON projects
WHEN NEW.company_id<>OLD.company_id
BEGIN
 SELECT RAISE(ABORT,'invoice_company_currency') WHERE EXISTS(SELECT 1 FROM invoices i WHERE i.org_id=OLD.org_id AND i.project_id=OLD.id);
END;
--> statement-breakpoint
CREATE TRIGGER invoice_currency_guard BEFORE UPDATE OF currency ON project_plans
WHEN NEW.currency<>OLD.currency
BEGIN
 SELECT RAISE(ABORT,'invoice_company_currency') WHERE EXISTS(SELECT 1 FROM invoices i WHERE i.org_id=OLD.org_id AND i.project_id=OLD.project_id);
END;
--> statement-breakpoint
CREATE TRIGGER invoice_payment_guard BEFORE INSERT ON invoice_payments
BEGIN
 SELECT RAISE(ABORT,'invoice_payment_limit') WHERE NEW.amount_cents<=0 OR NOT EXISTS(SELECT 1 FROM invoices i WHERE i.org_id=NEW.org_id AND i.id=NEW.invoice_id AND i.status='Issued' AND NEW.amount_cents+COALESCE((SELECT SUM(amount_cents) FROM invoice_payments p WHERE p.org_id=NEW.org_id AND p.invoice_id=NEW.invoice_id),0)<=i.amount_cents);
END;
