import type { PoolClient, QueryResultRow } from "pg";
import type {
  AuditHistoryItem,
  AuditOutput,
  StoredAuditReport,
  VulnerabilityFinding,
} from "@/lib/ai/schema";
import { getDatabasePool } from "@/lib/db";

interface AuditReportRow extends QueryResultRow {
  id: string;
  file_name: string;
  language: string;
  source_type: "github" | "local";
  total_issues: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  security_score: number;
  created_at: Date;
}

interface AuditFindingRow extends QueryResultRow {
  finding_key: string;
  title: string;
  severity: VulnerabilityFinding["severity"];
  owasp_category: string;
  cwe: string;
  line_start: number;
  line_end: number;
  description: string;
  recommendation: string;
}

function mapReportRow(row: AuditReportRow): AuditHistoryItem {
  return {
    id: row.id,
    fileName: row.file_name,
    language: row.language,
    sourceType: row.source_type,
    summary: {
      totalIssues: row.total_issues,
      criticalCount: row.critical_count,
      highCount: row.high_count,
      mediumCount: row.medium_count,
      lowCount: row.low_count,
      infoCount: row.info_count,
      securityScore: row.security_score,
    },
    createdAt: row.created_at.toISOString(),
  };
}

export async function saveAuditReport(input: {
  fileName: string;
  language: string;
  sourceType: "github" | "local";
  audit: AuditOutput;
}): Promise<StoredAuditReport> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { rows } = await client.query<AuditReportRow>(
      `INSERT INTO audit_reports (
         file_name, language, source_type, total_issues,
         critical_count, high_count, medium_count, low_count,
         info_count, security_score
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, file_name, language, source_type, total_issues,
         critical_count, high_count, medium_count, low_count,
         info_count, security_score, created_at`,
      [
        input.fileName,
        input.language,
        input.sourceType,
        input.audit.summary.totalIssues,
        input.audit.summary.criticalCount,
        input.audit.summary.highCount,
        input.audit.summary.mediumCount,
        input.audit.summary.lowCount,
        input.audit.summary.infoCount,
        input.audit.summary.securityScore,
      ],
    );
    const report = mapReportRow(rows[0]);

    for (const finding of input.audit.vulnerabilities) {
      await insertFinding(client, report.id, finding);
    }

    await client.query("COMMIT");
    return {
      ...report,
      vulnerabilities: input.audit.vulnerabilities.map((finding) => ({
        ...finding,
        codeSnippet: "",
      })),
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back the failed audit transaction:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function insertFinding(
  client: PoolClient,
  reportId: string,
  finding: VulnerabilityFinding,
): Promise<void> {
  await client.query(
    `INSERT INTO audit_findings (
       audit_report_id, finding_key, title, severity,
       owasp_category, cwe, line_start, line_end,
       description, recommendation
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      reportId,
      finding.id,
      finding.title,
      finding.severity,
      finding.owaspCategory,
      finding.cwe,
      finding.lineStart,
      finding.lineEnd,
      finding.description,
      finding.recommendation,
    ],
  );
}

export async function listAuditReports(limit: number): Promise<AuditHistoryItem[]> {
  const { rows } = await getDatabasePool().query<AuditReportRow>(
    `SELECT id::text, file_name, language, source_type, total_issues,
       critical_count, high_count, medium_count, low_count,
       info_count, security_score, created_at
     FROM audit_reports
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapReportRow);
}

export async function getAuditReport(
  id: string,
): Promise<StoredAuditReport | null> {
  const pool = getDatabasePool();
  const reportResult = await pool.query<AuditReportRow>(
    `SELECT id::text, file_name, language, source_type, total_issues,
       critical_count, high_count, medium_count, low_count,
       info_count, security_score, created_at
     FROM audit_reports
     WHERE id = $1`,
    [id],
  );

  if (reportResult.rowCount === 0) return null;

  const report = mapReportRow(reportResult.rows[0]);
  const findingResult = await pool.query<AuditFindingRow>(
    `SELECT finding_key, title, severity, owasp_category, cwe,
       line_start, line_end, description, recommendation
     FROM audit_findings
     WHERE audit_report_id = $1
     ORDER BY id ASC`,
    [id],
  );

  return {
    ...report,
    vulnerabilities: findingResult.rows.map((finding) => ({
      id: finding.finding_key,
      title: finding.title,
      severity: finding.severity,
      owaspCategory: finding.owasp_category,
      cwe: finding.cwe,
      lineStart: finding.line_start,
      lineEnd: finding.line_end,
      description: finding.description,
      recommendation: finding.recommendation,
      codeSnippet: "",
    })),
  };
}
