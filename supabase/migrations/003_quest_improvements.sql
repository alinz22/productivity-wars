-- Quest improvements: description, due date, priority, subtasks

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('p1','p2','p3')) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks_own" ON task_subtasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_subtasks.task_id AND tasks.player_id = auth.uid()
  ));
