ALTER TABLE audit_reports
  ADD COLUMN user_id TEXT;

CREATE INDEX audit_reports_user_created_at_idx
  ON audit_reports (user_id, created_at DESC, id DESC);
