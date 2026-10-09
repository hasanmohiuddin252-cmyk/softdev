CREATE TABLE audit_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_name TEXT NOT NULL CHECK (length(file_name) BETWEEN 1 AND 256),
  language TEXT NOT NULL CHECK (length(language) BETWEEN 1 AND 64),
  source_type TEXT NOT NULL CHECK (source_type IN ('github', 'local')),
  total_issues INTEGER NOT NULL CHECK (total_issues >= 0),
  critical_count INTEGER NOT NULL CHECK (critical_count >= 0),
  high_count INTEGER NOT NULL CHECK (high_count >= 0),
  medium_count INTEGER NOT NULL CHECK (medium_count >= 0),
  low_count INTEGER NOT NULL CHECK (low_count >= 0),
  info_count INTEGER NOT NULL CHECK (info_count >= 0),
  security_score INTEGER NOT NULL CHECK (security_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    total_issues =
      critical_count + high_count + medium_count + low_count + info_count
  )
);

CREATE INDEX audit_reports_created_at_idx ON audit_reports (created_at DESC);

CREATE TABLE audit_findings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  audit_report_id BIGINT NOT NULL REFERENCES audit_reports (id) ON DELETE CASCADE,
  finding_key TEXT NOT NULL CHECK (length(finding_key) BETWEEN 1 AND 80),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  owasp_category TEXT NOT NULL,
  cwe TEXT NOT NULL,
  line_start INTEGER NOT NULL CHECK (line_start > 0),
  line_end INTEGER NOT NULL CHECK (line_end >= line_start),
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  UNIQUE (audit_report_id, finding_key)
);

CREATE INDEX audit_findings_report_id_idx ON audit_findings (audit_report_id);
