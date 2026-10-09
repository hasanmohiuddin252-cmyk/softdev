"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CircleHelp,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Play,
  ShieldCheck,
} from "lucide-react";
import {
  AuditHistoryItemSchema,
  StoredAuditReportSchema,
  type AuditHistoryItem,
  type StoredAuditReport,
} from "@/lib/ai/schema";

interface AuditPanelProps {
  fileName: string | null;
  language: string;
  code: string;
  isRunning: boolean;
  refreshToken: number;
  latestReport: StoredAuditReport | null;
  onRunAudit: () => void;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function AuditPanel({
  fileName,
  language,
  code,
  isRunning,
  refreshToken,
  latestReport,
  onRunAudit,
}: AuditPanelProps) {
  const [reports, setReports] = useState<AuditHistoryItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<StoredAuditReport | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setHistoryError(null);
      try {
        const response = await fetch("/api/audits?limit=25");
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : "Audit history could not be loaded.",
          );
        }

        const rawReports =
          typeof payload === "object" &&
          payload !== null &&
          "reports" in payload
            ? payload.reports
            : null;
        const parsedReports = AuditHistoryItemSchema.array().safeParse(rawReports);
        if (!parsedReports.success) {
          throw new Error("The audit history service returned an invalid response.");
        }

        if (!cancelled) setReports(parsedReports.data);
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error ? error.message : "Audit history could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  async function openReport(reportId: string) {
    setIsLoadingReport(true);
    setHistoryError(null);
    try {
      const response = await fetch(`/api/audits/${encodeURIComponent(reportId)}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "The audit report could not be loaded.",
        );
      }

      const parsedReport = StoredAuditReportSchema.safeParse(payload);
      if (!parsedReport.success) {
        throw new Error("The audit report service returned an invalid response.");
      }
      setSelectedReport(parsedReport.data);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "The audit report could not be loaded.",
      );
    } finally {
      setIsLoadingReport(false);
    }
  }

  const report = selectedReport ?? latestReport;

  return (
    <aside aria-label="Security audit dashboard" className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <ShieldCheck aria-hidden="true" size={17} />
          Security overview
        </h1>
        <span className="phase-badge">Audit · Phase 2</span>
      </div>

      <div className="dashboard-content">
        <section className="welcome-card audit-action-card">
          <div aria-hidden="true" className="welcome-icon">
            <LockKeyhole size={19} />
          </div>
          <h2>{fileName ? "Ready to review this file" : "Load a file to begin"}</h2>
          <p>
            {fileName
              ? `Review ${fileName} (${language}) for security issues. Source code is sent for analysis but is never written to the audit database.`
              : "Load a GitHub or local source file to run a security audit."}
          </p>
          <button
            className="button button-primary audit-run-button"
            disabled={!fileName || code.trim().length === 0 || isRunning}
            onClick={onRunAudit}
            type="button"
          >
            {isRunning ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <Play aria-hidden="true" size={14} />
            )}
            {isRunning ? "Auditing..." : "Run security audit"}
          </button>
          <p className="audit-privacy-note">
            Audit history stores findings and file metadata only—not source code or code snippets.
          </p>
        </section>

        {historyError ? (
          <p aria-live="polite" className="history-error" role="status">
            <AlertCircle aria-hidden="true" size={13} />
            {historyError}
          </p>
        ) : null}

        {report ? (
          <section className="info-card report-card">
            <div className="report-card-header">
              <div>
                <h2 className="info-card-heading">Audit report</h2>
                <p className="report-meta">
                  {report.fileName} · {formatDate(report.createdAt)}
                </p>
              </div>
              <div aria-label={`Security score ${report.summary.securityScore} out of 100`} className="score-pill">
                {report.summary.securityScore}/100
              </div>
            </div>
            <div className="severity-counts">
              <span className="severity-count severity-critical">
                Critical {report.summary.criticalCount}
              </span>
              <span className="severity-count severity-high">
                High {report.summary.highCount}
              </span>
              <span className="severity-count severity-medium">
                Medium {report.summary.mediumCount}
              </span>
              <span className="severity-count severity-low">
                Low {report.summary.lowCount}
              </span>
            </div>
            {report.vulnerabilities.length === 0 ? (
              <p className="history-empty">No findings were reported for this file.</p>
            ) : (
              <div className="finding-list">
                {report.vulnerabilities.map((finding) => (
                  <article className="finding-item" key={finding.id}>
                    <div className="finding-item-heading">
                      <span className={`severity-mark severity-mark-${finding.severity.toLowerCase()}`} />
                      <h3>{finding.title}</h3>
                    </div>
                    <p className="finding-meta">
                      {finding.severity} · {finding.cwe || "CWE not specified"} · Lines{" "}
                      {finding.lineStart}–{finding.lineEnd}
                    </p>
                    <p>{finding.description}</p>
                    <p className="finding-recommendation">
                      <strong>Recommendation:</strong> {finding.recommendation}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="info-card">
            <h2 className="info-card-heading">
              <CircleHelp aria-hidden="true" size={14} />
              About this workspace
            </h2>
            <p>
              Audits use the server-side OpenAI key. A PostgreSQL connection is required to save
              and browse report history.
            </p>
          </section>
        )}

        <section aria-label="Audit history" className="info-card history-card">
          <div className="history-heading">
            <h2 className="info-card-heading">
              <Clock3 aria-hidden="true" size={14} />
              Recent audits
            </h2>
            <span className="history-count">{reports.length}</span>
          </div>
          {isLoadingHistory || isLoadingReport ? (
            <p className="history-empty">
              <LoaderCircle aria-hidden="true" className="animate-spin" size={13} />
              Loading history
            </p>
          ) : reports.length === 0 ? (
            <p className="history-empty">
              {historyError ? "History is unavailable until the database is configured." : "Saved audits will appear here."}
            </p>
          ) : (
            <div className="history-list">
              {reports.map((historyItem) => (
                <button
                  aria-current={report?.id === historyItem.id ? "true" : undefined}
                  className="history-item"
                  key={historyItem.id}
                  onClick={() => void openReport(historyItem.id)}
                  type="button"
                >
                  <span className="history-item-main">
                    <span className="history-file-name">{historyItem.fileName}</span>
                    <span className="history-date">{formatDate(historyItem.createdAt)}</span>
                  </span>
                  <span className="history-score">{historyItem.summary.securityScore}</span>
                </button>
              ))}
            </div>
          )}
          {reports.length > 0 ? (
            <p className="audit-privacy-note">
              Only findings and metadata are saved. Code snippets are removed from stored history.
            </p>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
