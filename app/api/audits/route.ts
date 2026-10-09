import { z } from "zod";
import { listAuditReports } from "@/lib/auditHistory";
import { DatabaseNotConfiguredError } from "@/lib/db";

const defaultLimit = 25;
const maximumLimit = 100;

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Audit history is not configured. Set DATABASE_URL on the server." },
      { status: 503 },
    );
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const parsedLimit =
    rawLimit === null
      ? { success: true as const, data: defaultLimit }
      : z.coerce.number().int().positive().safeParse(rawLimit);

  if (!parsedLimit.success) {
    return Response.json({ error: "The limit must be a positive integer." }, { status: 400 });
  }

  const limit = Math.min(parsedLimit.data, maximumLimit);

  try {
    const reports = await listAuditReports(limit);
    return Response.json({ reports });
  } catch (error) {
    console.error("Could not load audit history:", error);
    const message =
      error instanceof DatabaseNotConfiguredError
        ? error.message
        : "Audit history is temporarily unavailable. Check the database connection.";
    return Response.json({ error: message }, { status: 503 });
  }
}
