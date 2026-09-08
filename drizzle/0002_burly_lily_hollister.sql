CREATE TABLE `configurations` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `configuration_kind` ON `configurations` (`org_id`,`kind`);--> statement-breakpoint
CREATE TABLE `custom_roles` (
	`org_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`capabilities` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `id`),
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_role_name` ON `custom_roles` (`org_id`,`name`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recurring_runs` (
	`org_id` text NOT NULL,
	`config_id` text NOT NULL,
	`due` text NOT NULL,
	`ticket_id` integer NOT NULL,
	PRIMARY KEY(`org_id`, `config_id`, `due`),
	FOREIGN KEY (`org_id`,`config_id`) REFERENCES `configurations`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_assignments` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`role_id`) REFERENCES `custom_roles`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticket_metadata` (
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`org_id`, `ticket_id`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticket_relations` (
	`org_id` text NOT NULL,
	`ticket_id` integer NOT NULL,
	`target_id` integer NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`org_id`, `ticket_id`, `kind`),
	FOREIGN KEY (`org_id`,`ticket_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`target_id`) REFERENCES `tickets`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "relation_kind" CHECK("ticket_relations"."kind" IN ('parent','merge')),
	CONSTRAINT "different_ticket" CHECK("ticket_relations"."ticket_id" <> "ticket_relations"."target_id")
);
--> statement-breakpoint
CREATE INDEX `relation_target` ON `ticket_relations` (`org_id`,`target_id`,`kind`);
--> statement-breakpoint
CREATE TRIGGER relation_integrity_insert BEFORE INSERT ON ticket_relations BEGIN
 SELECT RAISE(ABORT,'relation_company') WHERE (SELECT company_id FROM tickets WHERE org_id=NEW.org_id AND id=NEW.ticket_id)<>(SELECT company_id FROM tickets WHERE org_id=NEW.org_id AND id=NEW.target_id);
 SELECT RAISE(ABORT,'relation_cycle') WHERE EXISTS(WITH RECURSIVE ancestors(id) AS (SELECT NEW.target_id UNION SELECT r.target_id FROM ticket_relations r JOIN ancestors a ON a.id=r.ticket_id WHERE r.org_id=NEW.org_id) SELECT id FROM ancestors WHERE id=NEW.ticket_id);
END;

--> statement-breakpoint
CREATE TRIGGER relation_integrity_update BEFORE UPDATE ON ticket_relations BEGIN
 SELECT RAISE(ABORT,'relation_company') WHERE (SELECT company_id FROM tickets WHERE org_id=NEW.org_id AND id=NEW.ticket_id)<>(SELECT company_id FROM tickets WHERE org_id=NEW.org_id AND id=NEW.target_id);
 SELECT RAISE(ABORT,'relation_cycle') WHERE EXISTS(WITH RECURSIVE ancestors(id) AS (SELECT NEW.target_id UNION SELECT r.target_id FROM ticket_relations r JOIN ancestors a ON a.id=r.ticket_id WHERE r.org_id=NEW.org_id) SELECT id FROM ancestors WHERE id=NEW.ticket_id);
END;

--> statement-breakpoint
CREATE TRIGGER notification_preferences BEFORE INSERT ON notifications WHEN EXISTS(SELECT 1 FROM preferences p WHERE p.org_id=NEW.org_id AND p.user_id=NEW.user_id AND ((NEW.title LIKE 'Ticket assigned:%' AND json_extract(p.data,'$.assignment')=0) OR (NEW.title LIKE 'Scheduled work%' AND json_extract(p.data,'$.schedule')=0) OR ((NEW.title LIKE 'Customer replied%' OR NEW.title LIKE 'Reply posted%') AND json_extract(p.data,'$.replies')=0))) BEGIN
 SELECT RAISE(IGNORE);
END;
