"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";
import type { editor } from "monaco-editor";
import { AlertCircle, Braces, FileCode2, LoaderCircle } from "lucide-react";
import { CodeViewer } from "@/components/editor/CodeViewer";
import { FileTree } from "@/components/editor/FileTree";
import { AuditPanel } from "@/components/dashboard/AuditPanel";
import { Header } from "@/components/layout/Header";
import { SplitPaneLayout } from "@/components/layout/SplitPaneLayout";
import { StatusBar } from "@/components/layout/StatusBar";
import type { Theme } from "@/components/layout/ThemeToggle";
import {
  StoredAuditReportSchema,
  type StoredAuditReport,
} from "@/lib/ai/schema";
import { languageFromFileName } from "@/lib/files";
import { githubFileUrl, GitHubUrlError, parseGitHubUrl } from "@/lib/github/parseUrl";
import type {
  RepositoryFile,
  RepositoryTree,
  WorkspaceFile,
} from "@/types/repository";

const welcomeCode = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("developer"));
`;
const localFileLimit = 5 * 1024 * 1024;

interface LocalFile {
  file: WorkspaceFile;
  content: string;
}

const themeChangeEvent = "sentinel-theme-change";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRepositoryTree(value: unknown): value is RepositoryTree {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.repo === "string" &&
    typeof value.branch === "string" &&
    Array.isArray(value.files) &&
    value.files.every(
      (file) =>
        isRecord(file) &&
        typeof file.path === "string" &&
        typeof file.sha === "string" &&
        typeof file.size === "number",
    )
  );
}

function getApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string" ? value.error : null;
}

async function readApiResponse<T>(
  response: Response,
  isExpected: (value: unknown) => value is T,
): Promise<T> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiError(payload) ?? `Request failed with status ${response.status}.`,
    );
  }

  if (!isExpected(payload)) {
    throw new Error("The server returned an unexpected response.");
  }

  return payload;
}

function isFileResponse(value: unknown): value is { content: string } {
  return isRecord(value) && typeof value.content === "string";
}

export function Workspace() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repository, setRepository] = useState<RepositoryTree | null>(null);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [code, setCode] = useState(welcomeCode);
  const [savedCode, setSavedCode] = useState(welcomeCode);
  const theme = useSyncExternalStore<Theme>(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const [editorWidth, setEditorWidth] = useState(63);
  const [isLoadingRepository, setIsLoadingRepository] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditRefreshToken, setAuditRefreshToken] = useState(0);
  const [latestAuditReport, setLatestAuditReport] =
    useState<StoredAuditReport | null>(null);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; message: string } | null>(
    null,
  );
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepth = useRef(0);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("sentinel-theme");
      const preferredTheme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = preferredTheme;
      window.dispatchEvent(new Event(themeChangeEvent));
    } catch (error) {
      console.error("Could not load the saved theme preference:", error);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event(themeChangeEvent));

    try {
      window.localStorage.setItem("sentinel-theme", nextTheme);
    } catch (error) {
      console.error("Could not save the theme preference:", error);
      setNotice({
        kind: "info",
        message: "Theme changed, but the browser could not save your preference.",
      });
    }
  }

  function activateFile(file: WorkspaceFile, content: string) {
    setActiveFile(file);
    setCode(content);
    setSavedCode(content);
    setLatestAuditReport(null);
    setNotice(null);
  }

  async function runAudit() {
    if (!activeFile) {
      setNotice({ kind: "error", message: "Load a source file before starting an audit." });
      return;
    }

    setIsRunningAudit(true);
    setNotice(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: activeFile.name,
          language: activeFile.language,
          code,
          sourceType: activeFile.source,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          getApiError(payload) ?? `The audit request failed with status ${response.status}.`,
        );
      }

      const parsedReport = StoredAuditReportSchema.safeParse(payload);
      if (!parsedReport.success) {
        throw new Error("The audit service returned an invalid report.");
      }

      setLatestAuditReport(parsedReport.data);
      setAuditRefreshToken((current) => current + 1);
      setNotice({ kind: "info", message: "Audit completed and saved to history." });
    } catch (error) {
      console.error("Could not run the security audit:", error);
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not run the security audit.",
      });
    } finally {
      setIsRunningAudit(false);
    }
  }

  async function loadRepositoryFile(
    file: RepositoryFile,
    sourceRepository: RepositoryTree | null = repository,
  ) {
    if (!sourceRepository) return;

    setLoadingPath(file.path);
    setNotice(null);

    try {
      const url = githubFileUrl(
        sourceRepository.owner,
        sourceRepository.repo,
        sourceRepository.branch,
        file.path,
      );
      const response = await fetch("/api/repo/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await readApiResponse(response, isFileResponse);
      activateFile(
        {
          name: file.path.split("/").pop() ?? file.path,
          path: file.path,
          language: languageFromFileName(file.path),
          source: "github",
        },
        data.content,
      );
    } catch (error) {
      console.error("Could not load the selected GitHub file:", error);
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not load the selected file.",
      });
    } finally {
      setLoadingPath(null);
    }
  }

  async function loadRepository() {
    setNotice(null);

    let parsedUrl;
    try {
      parsedUrl = parseGitHubUrl(repositoryUrl);
    } catch (error) {
      if (error instanceof GitHubUrlError) {
        setNotice({ kind: "error", message: error.message });
        return;
      }
      throw error;
    }

    setIsLoadingRepository(true);

    try {
      const treeResponse = await fetch(
        `/api/repo/tree?url=${encodeURIComponent(repositoryUrl)}`,
      );
      const tree = await readApiResponse(treeResponse, isRepositoryTree);
      setRepository(tree);
      setActiveFile(null);
      setCode(welcomeCode);
      setSavedCode(welcomeCode);

      if (parsedUrl.kind === "file") {
        if (parsedUrl.path) {
          await loadRepositoryFile({
            path: parsedUrl.path,
            sha: "",
            size: 0,
          }, tree);
        }
      } else if (tree.files.length === 0) {
        setNotice({ kind: "info", message: "No files were found at this repository path." });
      }
    } catch (error) {
      console.error("Could not load the GitHub repository:", error);
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not load this repository.",
      });
    } finally {
      setIsLoadingRepository(false);
    }
  }

  async function loadLocalFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    const oversizedFiles = selectedFiles.filter((file) => file.size > localFileLimit);
    const acceptedFiles = selectedFiles.filter((file) => file.size <= localFileLimit);

    if (acceptedFiles.length === 0) {
      setNotice({
        kind: "error",
        message: `Files must be no larger than ${localFileLimit / (1024 * 1024)} MB.`,
      });
      return;
    }

    try {
      const loadedFiles = await Promise.all(
        acceptedFiles.map(async (file): Promise<LocalFile> => {
          const path = file.webkitRelativePath || file.name;
          return {
            file: {
              name: file.name,
              path,
              language: languageFromFileName(file.name),
              source: "local",
            },
            content: await file.text(),
          };
        }),
      );

      setLocalFiles((currentFiles) => {
        const merged = new Map(currentFiles.map((entry) => [entry.file.path, entry]));
        for (const entry of loadedFiles) merged.set(entry.file.path, entry);
        return Array.from(merged.values()).sort((left, right) =>
          left.file.path.localeCompare(right.file.path),
        );
      });
      activateFile(loadedFiles[0].file, loadedFiles[0].content);
      if (oversizedFiles.length > 0) {
        setNotice({
          kind: "info",
          message: `Loaded ${loadedFiles.length} file(s); skipped ${oversizedFiles.length} file(s) larger than 5 MB.`,
        });
      }
    } catch (error) {
      console.error("Could not read the selected local files:", error);
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not read the selected files.",
      });
    }
  }

  function selectLocalFile(path: string) {
    const match = localFiles.find((entry) => entry.file.path === path);
    if (match) activateFile(match.file, match.content);
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepth.current += 1;
    setIsDraggingFiles(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingFiles(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDraggingFiles(false);
    void loadLocalFiles(event.dataTransfer.files);
  }

  const isDirty = activeFile !== null && code !== savedCode;

  return (
    <main
      className="app-shell"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Header
        isLoading={isLoadingRepository}
        onFilesSelected={(files) => void loadLocalFiles(files)}
        onLoadRepository={() => void loadRepository()}
        onRepositoryUrlChange={setRepositoryUrl}
        onToggleTheme={toggleTheme}
        repositoryUrl={repositoryUrl}
        theme={theme}
      />

      {notice ? (
        <div
          aria-live="polite"
          className={`notice ${notice.kind === "error" ? "notice-error" : ""}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <AlertCircle aria-hidden="true" className="inline-icon" size={14} />
          {notice.message}
        </div>
      ) : null}

      <SplitPaneLayout
        dashboard={
          <AuditPanel
            key={latestAuditReport?.id ?? "audit-dashboard"}
            code={code}
            fileName={activeFile?.name ?? null}
            isRunning={isRunningAudit}
            language={activeFile?.language ?? "plaintext"}
            latestReport={latestAuditReport}
            onRunAudit={() => void runAudit()}
            refreshToken={auditRefreshToken}
          />
        }
        editorWidth={editorWidth}
        onEditorWidthChange={setEditorWidth}
        editor={
          <section aria-label="Code editor" className="workbench">
            <FileTree
              activePath={activeFile?.path ?? null}
              activeSource={activeFile?.source ?? null}
              loadingPath={loadingPath}
              localFiles={localFiles.map((entry) => entry.file)}
              onSelectLocalFile={selectLocalFile}
              onSelectRepositoryFile={(file) => void loadRepositoryFile(file)}
              repository={repository}
            />
            <section aria-label="Source editor" className="editor-column">
              <div className="editor-toolbar">
                <div className="editor-file-title">
                  {activeFile ? (
                    <FileCode2 aria-hidden="true" size={15} />
                  ) : (
                    <Braces aria-hidden="true" size={15} />
                  )}
                  <span>{activeFile?.path ?? "Welcome"}</span>
                </div>
                <div className="editor-file-subtitle">
                  {activeFile ? (
                    <>
                      <span className="editor-subtitle-secondary">
                        {activeFile.source === "github" ? "GitHub" : "Local"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="language-chip">{activeFile.language}</span>
                    </>
                  ) : (
                    <span className="language-chip">typescript</span>
                  )}
                </div>
              </div>
              <div className="editor-surface">
                {isLoadingRepository ? (
                  <div className="editor-empty">
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={20} />
                    <span className="visually-hidden">Loading repository files</span>
                  </div>
                ) : (
                  <CodeViewer
                    code={code}
                    language={activeFile?.language ?? "typescript"}
                    onChange={setCode}
                    onEditorMount={(instance) => {
                      editorRef.current = instance;
                    }}
                    theme={theme}
                  />
                )}
              </div>
              <StatusBar code={code} file={activeFile} isDirty={isDirty} />
            </section>
          </section>
        }
      />

      {isDraggingFiles ? <div className="drag-overlay">Drop source files to open them</div> : null}
    </main>
  );
}
