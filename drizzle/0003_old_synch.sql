CREATE TABLE `task_dependencies` (
	`org_id` text NOT NULL,
	`task_id` text NOT NULL,
	`dependency_id` text NOT NULL,
	PRIMARY KEY(`org_id`, `task_id`, `dependency_id`),
	FOREIGN KEY (`org_id`,`task_id`) REFERENCES `project_tasks`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`org_id`,`dependency_id`) REFERENCES `project_tasks`(`org_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "different_task" CHECK("task_dependencies"."task_id"<>"task_dependencies"."dependency_id")
);
--> statement-breakpoint
CREATE TRIGGER task_dependency_integrity BEFORE INSERT ON task_dependencies BEGIN
 SELECT RAISE(ABORT,'dependency_project') WHERE (SELECT project_id FROM project_tasks WHERE org_id=NEW.org_id AND id=NEW.task_id)<>(SELECT project_id FROM project_tasks WHERE org_id=NEW.org_id AND id=NEW.dependency_id);
 SELECT RAISE(ABORT,'dependency_cycle') WHERE EXISTS(WITH RECURSIVE ancestors(id) AS (SELECT NEW.dependency_id UNION SELECT d.dependency_id FROM task_dependencies d JOIN ancestors a ON d.task_id=a.id WHERE d.org_id=NEW.org_id) SELECT id FROM ancestors WHERE id=NEW.task_id);
END;
--> statement-breakpoint
CREATE TRIGGER task_completion_guard BEFORE UPDATE ON project_tasks WHEN NEW.done=1 AND EXISTS(SELECT 1 FROM task_dependencies d JOIN project_tasks t ON t.org_id=d.org_id AND t.id=d.dependency_id WHERE d.org_id=NEW.org_id AND d.task_id=NEW.id AND t.done=0) BEGIN
 SELECT RAISE(ABORT,'dependency_incomplete');
END;
--> statement-breakpoint
CREATE TRIGGER task_reopen_guard BEFORE UPDATE ON project_tasks WHEN NEW.done=0 AND OLD.done=1 AND EXISTS(SELECT 1 FROM task_dependencies d JOIN project_tasks t ON t.org_id=d.org_id AND t.id=d.task_id WHERE d.org_id=NEW.org_id AND d.dependency_id=NEW.id AND t.done=1) BEGIN
 SELECT RAISE(ABORT,'dependency_completed');
END;

--> statement-breakpoint
CREATE TRIGGER dependency_move_guard BEFORE UPDATE ON project_tasks WHEN NEW.project_id<>OLD.project_id AND EXISTS(SELECT 1 FROM task_dependencies WHERE org_id=NEW.org_id AND (task_id=NEW.id OR dependency_id=NEW.id)) BEGIN
 SELECT RAISE(ABORT,'dependency_project');
END;
