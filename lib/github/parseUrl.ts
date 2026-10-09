export type GitHubUrlKind = "repository" | "tree" | "file";

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  kind: GitHubUrlKind;
  ref?: string;
  path?: string;
}

export class GitHubUrlError extends Error {}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw new GitHubUrlError("The GitHub URL contains an invalid encoded path.");
  }
}

export function parseGitHubUrl(input: string): ParsedGitHubUrl {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new GitHubUrlError("Enter a valid GitHub repository or file URL.");
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    throw new GitHubUrlError("Only HTTPS URLs from github.com are supported.");
  }

  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(decodePathSegment);

  if (segments.length < 2) {
    throw new GitHubUrlError("The URL must include an owner and repository name.");
  }

  const [owner, rawRepo, section, rawRef, ...remainingPath] = segments;
  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;

  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new GitHubUrlError("The owner or repository name is invalid.");
  }

  if (!section) return { owner, repo, kind: "repository" };

  if ((section !== "blob" && section !== "tree") || !rawRef) {
    throw new GitHubUrlError(
      "Use a repository URL or a GitHub file URL containing /blob/{branch}/{path}.",
    );
  }

  const path = remainingPath.join("/");
  if (section === "blob" && !path) {
    throw new GitHubUrlError("The GitHub file URL must include a file path.");
  }

  return {
    owner,
    repo,
    kind: section === "blob" ? "file" : "tree",
    ref: rawRef,
    ...(path ? { path } : {}),
  };
}

export function githubFileUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): string {
  const encodedBranch = encodeURIComponent(branch);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blob/${encodedBranch}/${encodedPath}`;
}
