"use client";

import { create } from "zustand";
import type { VulnerabilityFinding } from "@/lib/ai/schema";

export const welcomeCode = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("developer"));
`;

export type SeverityFilter = "ALL" | VulnerabilityFinding["severity"];

interface AuditState {
  code: string;
  findings: VulnerabilityFinding[];
  findingsReportId: string | null;
  severityFilter: SeverityFilter;
  selectedIssueIndex: number | null;
  setCode: (code: string) => void;
  setFindings: (reportId: string, findings: VulnerabilityFinding[]) => void;
  clearFindings: () => void;
  setSeverityFilter: (filter: SeverityFilter) => void;
  selectIssue: (index: number | null) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  code: welcomeCode,
  findings: [],
  findingsReportId: null,
  severityFilter: "ALL",
  selectedIssueIndex: null,
  setCode: (code) =>
    set((state) =>
      state.code === code
        ? state
        : {
            code,
            findings: [],
            findingsReportId: null,
            selectedIssueIndex: null,
            severityFilter: "ALL",
          },
    ),
  setFindings: (reportId, findings) =>
    set({
      findings,
      findingsReportId: reportId,
      selectedIssueIndex: null,
      severityFilter: "ALL",
    }),
  clearFindings: () =>
    set({
      findings: [],
      findingsReportId: null,
      selectedIssueIndex: null,
      severityFilter: "ALL",
    }),
  setSeverityFilter: (severityFilter) =>
    set({ severityFilter, selectedIssueIndex: null }),
  selectIssue: (selectedIssueIndex) => set({ selectedIssueIndex }),
}));
