import { Octokit } from "@octokit/rest";

export function createGitHubClient(): Octokit {
  return new Octokit({
    ...(process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {}),
  });
}
