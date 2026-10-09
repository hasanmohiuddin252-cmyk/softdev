import { Workspace } from "@/components/layout/Workspace";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.githubLogin) redirect("/sign-in");

  return <Workspace githubLogin={session.user.githubLogin} />;
}
