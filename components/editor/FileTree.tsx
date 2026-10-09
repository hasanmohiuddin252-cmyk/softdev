"use client";

import { useMemo, useState } from "react";
import { FileCode2, FileText, FolderGit2, Search } from "lucide-react";
import { formatFileSize } from "@/lib/files";
import type { RepositoryFile, RepositoryTree, WorkspaceFile } from "@/types/repository";

interface FileTreeProps {
  localFiles: WorkspaceFile[];
  repository: RepositoryTree | null;
  activePath: string | null;
  activeSource: WorkspaceFile["source"] | null;
  loadingPath: string | null;
  onSelectLocalFile: (path: string) => void;
  onSelectRepositoryFile: (file: RepositoryFile) => void;
}

export function FileTree({
  localFiles,
  repository,
  activePath,
  activeSource,
  loadingPath,
  onSelectLocalFile,
  onSelectRepositoryFile,
}: FileTreeProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLocalFiles = useMemo(
    () =>
      localFiles.filter((file) => file.path.toLowerCase().includes(normalizedQuery)),
    [localFiles, normalizedQuery],
  );
  const visibleRepositoryFiles = useMemo(
    () =>
      (repository?.files ?? []).filter((file) =>
        file.path.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, repository],
  );

  const hasFiles = localFiles.length > 0 || (repository?.files.length ?? 0) > 0;

  return (
    <aside aria-label="File explorer" className="file-sidebar">
      <div className="sidebar-heading">
        <span>Explorer</span>
        <span className="source-label">
          {repository ? (
            <>
              <FolderGit2 aria-hidden="true" size={12} />
              {repository.owner}/{repository.repo}
            </>
          ) : localFiles.length > 0 ? (
            "Local files"
          ) : (
            "Workspace"
          )}
        </span>
      </div>

      <label className="file-search">
        <Search aria-hidden="true" size={13} />
        <span className="visually-hidden">Filter files</span>
        <input
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Filter files"
          value={query}
        />
      </label>

      <div className="file-list">
        {!hasFiles ? (
          <p className="file-list-empty">
            Load a public GitHub repository or open local source files to get started.
          </p>
        ) : visibleLocalFiles.length === 0 && visibleRepositoryFiles.length === 0 ? (
          <p className="file-list-empty">No files match “{query}”.</p>
        ) : (
          <>
            {visibleLocalFiles.map((file) => (
              <button
                aria-current={
                  activeSource === "local" && activePath === file.path ? "true" : undefined
                }
                className="file-row"
                key={`local:${file.path}`}
                onClick={() => onSelectLocalFile(file.path)}
                type="button"
              >
                <FileCode2 aria-hidden="true" size={14} />
                <span className="file-row-name">{file.path}</span>
              </button>
            ))}
            {visibleRepositoryFiles.map((file) => (
              <button
                aria-current={
                  activeSource === "github" && activePath === file.path ? "true" : undefined
                }
                className="file-row"
                disabled={loadingPath === file.path}
                key={`github:${file.path}`}
                onClick={() => onSelectRepositoryFile(file)}
                type="button"
              >
                {file.path.toLowerCase().endsWith(".md") ? (
                  <FileText aria-hidden="true" size={14} />
                ) : (
                  <FileCode2 aria-hidden="true" size={14} />
                )}
                <span className="file-row-name">{file.path}</span>
                <span className="file-row-size">{formatFileSize(file.size)}</span>
              </button>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer source-label">
        Drag files into the workspace or use Open files above.
      </div>
    </aside>
  );
}
