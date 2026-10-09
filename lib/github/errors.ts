export interface GitHubRouteError {
  status: number;
  message: string;
}

function getStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  return typeof error.status === "number" ? error.status : undefined;
}

export function getGitHubRouteError(error: unknown): GitHubRouteError {
  const status = getStatus(error);

  if (status === 404) {
    return {
      status: 404,
      message: "Repository or file not found. Check the URL and repository access.",
    };
  }

  if (status === 401) {
    return {
      status: 502,
      message: "GitHub rejected the configured token. Check GITHUB_TOKEN or remove it for public repositories.",
    };
  }

  if (status === 403) {
    return {
      status: 429,
      message: "GitHub rate limit reached or repository access was denied. Add a GitHub token and try again.",
    };
  }

  console.error("GitHub API request failed:", error);
  return {
    status: 502,
    message: "GitHub could not complete the request. Try again later.",
  };
}
