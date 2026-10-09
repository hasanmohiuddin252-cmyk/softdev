import { z } from "zod";

export const SeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);

export const VulnerabilityFindingSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(3).max(200),
    severity: SeverityEnum,
    owaspCategory: z.string().max(120),
    cwe: z.string().max(40),
    lineStart: z.number().int().positive(),
    lineEnd: z.number().int().positive(),
    description: z.string().min(1).max(4000),
    recommendation: z.string().min(1).max(4000),
    codeSnippet: z.string().max(2000),
  })
  .strict();

export const AuditFindingsSchema = z
  .object({
    vulnerabilities: z.array(VulnerabilityFindingSchema).max(200),
  })
  .strict();

export const FixOutputSchema = z
  .object({
    fixedCode: z.string().min(1),
  })
  .strict();

export const AuditOutputSchema = z
  .object({
    summary: z
      .object({
        totalIssues: z.number().int().min(0),
        criticalCount: z.number().int().min(0),
        highCount: z.number().int().min(0),
        mediumCount: z.number().int().min(0),
        lowCount: z.number().int().min(0),
        infoCount: z.number().int().min(0),
        securityScore: z.number().int().min(0).max(100),
      })
      .strict(),
    vulnerabilities: z.array(VulnerabilityFindingSchema).max(200),
  })
  .strict();

export const AuditHistoryItemSchema = z
  .object({
    id: z.string().min(1),
    fileName: z.string(),
    language: z.string(),
    sourceType: z.enum(["github", "local"]),
    summary: AuditOutputSchema.shape.summary,
    createdAt: z.string().datetime(),
  })
  .strict();

export const StoredAuditReportSchema = AuditHistoryItemSchema.extend({
  vulnerabilities: z.array(VulnerabilityFindingSchema),
}).strict();

export type AuditFindings = z.infer<typeof AuditFindingsSchema>;
export type AuditHistoryItem = z.infer<typeof AuditHistoryItemSchema>;
export type AuditOutput = z.infer<typeof AuditOutputSchema>;
export type StoredAuditReport = z.infer<typeof StoredAuditReportSchema>;
export type VulnerabilityFinding = z.infer<typeof VulnerabilityFindingSchema>;
