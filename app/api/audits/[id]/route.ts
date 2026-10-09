import { getAuditReport } from "@/lib/auditHistory";
import { DatabaseNotConfiguredError } from "@/lib/db";

const maximumPostgresBigint = "9223372036854775807";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Audit history is not configured. Set DATABASE_URL on the server." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const isPositiveInteger = /^[1-9]\d*$/.test(id);
  const exceedsPostgresBigint =
    id.length > maximumPostgresBigint.length ||
    (id.length === maximumPostgresBigint.length && id > maximumPostgresBigint);
  if (!isPositiveInteger || exceedsPostgresBigint) {
    return Response.json({ error: "Audit report ID must be a positive integer." }, { status: 400 });
  }

  try {
    const report = await getAuditReport(id);
    if (!report) {
      return Response.json({ error: "Audit report not found." }, { status: 404 });
    }
    return Response.json(report);
  } catch (error) {
    console.error("Could not load the requested audit report:", error);
    const message =
      error instanceof DatabaseNotConfiguredError
        ? error.message
        : "The audit report is temporarily unavailable. Check the database connection.";
    return Response.json({ error: message }, { status: 503 });
  }
}
