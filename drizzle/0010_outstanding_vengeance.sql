CREATE TABLE `suspended_memberships` (
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`org_id`, `user_id`),
	FOREIGN KEY (`org_id`,`user_id`) REFERENCES `memberships`(`org_id`,`user_id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TRIGGER subscription_member_capacity BEFORE INSERT ON memberships
WHEN NOT EXISTS(SELECT 1 FROM memberships WHERE org_id=NEW.org_id AND user_id=NEW.user_id)
AND EXISTS(SELECT 1 FROM workspace_subscriptions s WHERE s.org_id=NEW.org_id AND s.status IN ('active','trialing') AND (SELECT COUNT(*) FROM memberships m WHERE m.org_id=NEW.org_id AND NOT EXISTS(SELECT 1 FROM suspended_memberships x WHERE x.org_id=m.org_id AND x.user_id=m.user_id))>=s.seats)
BEGIN SELECT RAISE(ABORT,'subscription_seat_capacity'); END;
--> statement-breakpoint
CREATE TRIGGER subscription_invitation_capacity BEFORE INSERT ON invitations
WHEN NOT EXISTS(SELECT 1 FROM invitations WHERE org_id=NEW.org_id AND email=NEW.email AND expires>strftime('%Y-%m-%dT%H:%M:%fZ','now'))
AND EXISTS(SELECT 1 FROM workspace_subscriptions s WHERE s.org_id=NEW.org_id AND s.status IN ('active','trialing') AND (SELECT COUNT(*) FROM memberships m WHERE m.org_id=NEW.org_id AND NOT EXISTS(SELECT 1 FROM suspended_memberships x WHERE x.org_id=m.org_id AND x.user_id=m.user_id))+(SELECT COUNT(*) FROM invitations i WHERE i.org_id=NEW.org_id AND i.expires>strftime('%Y-%m-%dT%H:%M:%fZ','now'))>=s.seats)
BEGIN SELECT RAISE(ABORT,'subscription_seat_capacity'); END;
--> statement-breakpoint
CREATE TRIGGER subscription_restore_capacity BEFORE DELETE ON suspended_memberships
WHEN EXISTS(SELECT 1 FROM workspace_subscriptions s WHERE s.org_id=OLD.org_id AND s.status IN ('active','trialing') AND (SELECT COUNT(*) FROM memberships m WHERE m.org_id=OLD.org_id AND NOT EXISTS(SELECT 1 FROM suspended_memberships x WHERE x.org_id=m.org_id AND x.user_id=m.user_id))+(SELECT COUNT(*) FROM invitations i WHERE i.org_id=OLD.org_id AND i.expires>strftime('%Y-%m-%dT%H:%M:%fZ','now'))>=s.seats)
BEGIN SELECT RAISE(ABORT,'subscription_seat_capacity'); END;
