import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Sign in is required to access this resource." }, { status: 401 });
}
