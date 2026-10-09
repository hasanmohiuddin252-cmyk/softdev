export interface RepositoryFile {
  path: string;
  sha: string;
  size: number;
}

export interface RepositoryTree {
  owner: string;
  repo: string;
  branch: string;
  files: RepositoryFile[];
}

export interface WorkspaceFile {
  name: string;
  path: string;
  language: string;
  source: "github" | "local";
}
