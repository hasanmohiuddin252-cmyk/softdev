import { createGitHubClient } from "@/lib/github/client";
import { getGitHubRouteError } from "@/lib/github/errors";
import { GitHubUrlError, parseGitHubUrl } from "@/lib/github/parseUrl";
import { getAuthenticatedUserId, unauthorizedResponse } from "@/lib/authSession";

export async function GET(request: Request) {
  if (!(await getAuthenticatedUserId())) return unauthorizedResponse();

  const requestedUrl = new URL(request.url).searchParams.get("url");
  if (!requestedUrl) {
    return Response.json({ error: "Provide a GitHub repository URL." }, { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = parseGitHubUrl(requestedUrl);
  } catch (error) {
    if (error instanceof GitHubUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    const octokit = createGitHubClient();
    let branch = parsedUrl.ref;

    if (!branch) {
      const repository = await octokit.rest.repos.get({
        owner: parsedUrl.owner,
        repo: parsedUrl.repo,
      });
      branch = repository.data.default_branch;
    }

    const branchResponse = await octokit.rest.repos.getBranch({
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      branch,
    });
    const treeResponse = await octokit.rest.git.getTree({
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      tree_sha: branchResponse.data.commit.commit.tree.sha,
      recursive: "true",
    });

    if (treeResponse.data.truncated) {
      return Response.json(
        { error: "This repository is too large to display as a complete file tree." },
        { status: 413 },
      );
    }

    const pathPrefix = parsedUrl.kind === "tree" ? parsedUrl.path : undefined;
    const files = treeResponse.data.tree
      .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
      .filter(
        (entry) =>
          !pathPrefix || entry.path!.startsWith(`${pathPrefix}/`),
      )
      .map((entry) => ({
        path: entry.path!,
        sha: entry.sha ?? "",
        size: entry.size ?? 0,
      }))
      .sort((left, right) => left.path.localeCompare(right.path));

    return Response.json({
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      branch,
      files,
    });
  } catch (error) {
    const routeError = getGitHubRouteError(error);
    return Response.json({ error: routeError.message }, { status: routeError.status });
  }
}
