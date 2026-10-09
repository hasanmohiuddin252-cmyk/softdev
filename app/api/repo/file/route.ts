import { createGitHubClient } from "@/lib/github/client";
import { getGitHubRouteError } from "@/lib/github/errors";
import { GitHubUrlError, parseGitHubUrl } from "@/lib/github/parseUrl";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("url" in payload) ||
    typeof payload.url !== "string" ||
    payload.url.trim().length === 0
  ) {
    return Response.json({ error: "Provide a GitHub file URL." }, { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = parseGitHubUrl(payload.url);
  } catch (error) {
    if (error instanceof GitHubUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (parsedUrl.kind !== "file" || !parsedUrl.path || !parsedUrl.ref) {
    return Response.json(
      { error: "Provide a GitHub file URL containing /blob/{branch}/{path}." },
      { status: 400 },
    );
  }

  try {
    const octokit = createGitHubClient();
    const response = await octokit.rest.repos.getContent({
      owner: parsedUrl.owner,
      repo: parsedUrl.repo,
      path: parsedUrl.path,
      ref: parsedUrl.ref,
    });

    if (
      Array.isArray(response.data) ||
      response.data.type !== "file" ||
      !("content" in response.data)
    ) {
      return Response.json({ error: "The selected GitHub path is not a file." }, { status: 400 });
    }

    if (response.data.encoding !== "base64") {
      return Response.json(
        { error: "This file exceeds GitHub's contents API size limit (1 MB)." },
        { status: 413 },
      );
    }

    const content = Buffer.from(response.data.content, "base64").toString("utf8");
    return Response.json({ content, size: response.data.size });
  } catch (error) {
    const routeError = getGitHubRouteError(error);
    return Response.json({ error: routeError.message }, { status: routeError.status });
  }
}
