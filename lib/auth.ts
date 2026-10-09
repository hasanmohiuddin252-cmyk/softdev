import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { z } from "zod";

const GitHubIdentitySchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
});

function parseGitHubIdentity(profile: unknown) {
  const result = GitHubIdentitySchema.safeParse(profile);
  return result.success ? result.data : null;
}
function getAllowedGitHubUsers(): Set<string> {
  return new Set(
    (process.env.ALLOWED_GITHUB_USERS ?? "")
      .split(",")
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: { params: { scope: "read:user" } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const identity = parseGitHubIdentity(profile);
      return (
        identity !== null &&
        getAllowedGitHubUsers().has(identity.login.toLowerCase())
      );
    },
    async jwt({ token, profile }) {
      const identity = parseGitHubIdentity(profile);
      if (identity) {
        token.userId = String(identity.id);
        token.githubLogin = identity.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
        session.user.githubLogin =
          typeof token.githubLogin === "string" ? token.githubLogin : "";
      }
      return session;
    },
  },
  pages: { signIn: "/sign-in" },
};
