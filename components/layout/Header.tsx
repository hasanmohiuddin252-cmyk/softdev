"use client";

import { useRef, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { ArrowUpRight, GitBranch, GitFork, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import { ThemeToggle, type Theme } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  githubLogin: string;
  repositoryUrl: string;
  isLoading: boolean;
  theme: Theme;
  onRepositoryUrlChange: (url: string) => void;
  onLoadRepository: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onToggleTheme: () => void;
}

export function Header({
  githubLogin,
  repositoryUrl,
  isLoading,
  theme,
  onRepositoryUrlChange,
  onLoadRepository,
  onFilesSelected,
  onToggleTheme,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLoadRepository();
  }

  return (
    <header className="app-header">
      <div className="brand">
        <span aria-hidden="true" className="brand-mark">
          <ShieldCheck size={19} />
        </span>
        <div>
          <p className="brand-title">Sentinel</p>
          <p className="brand-caption">AI code security workspace</p>
        </div>
      </div>

      <form className="repo-form" onSubmit={handleSubmit}>
        <label className="repo-input-wrap">
          <GitBranch aria-hidden="true" size={15} />
          <span className="visually-hidden">GitHub repository or file URL</span>
          <input
            autoComplete="url"
            className="repo-input"
            onChange={(event) => onRepositoryUrlChange(event.currentTarget.value)}
            placeholder="Paste a GitHub repository or /blob/ file URL"
            spellCheck={false}
            type="url"
            value={repositoryUrl}
          />
        </label>
        <button className="button button-primary" disabled={isLoading} type="submit">
          {isLoading ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <ArrowUpRight aria-hidden="true" size={14} />
          )}
          {isLoading ? "Loading" : "Load"}
        </button>
      </form>

      <div className="header-actions">
        <span className="account-label" title={`Signed in as ${githubLogin}`}>
          <GitFork aria-hidden="true" size={13} />
          {githubLogin}
        </span>
        <input
          ref={fileInputRef}
          accept="text/*,.c,.cpp,.cs,.go,.h,.hpp,.java,.js,.jsx,.md,.php,.py,.rb,.rs,.sh,.sql,.ts,.tsx,.xml,.yaml,.yml"
          className="file-input-hidden"
          hidden
          multiple
          onChange={(event) => {
            onFilesSelected(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          type="file"
        />
        <button
          className="button"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload aria-hidden="true" size={14} />
          <span>Open files</span>
        </button>
        <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        <button
          className="button"
          onClick={() => void signOut({ callbackUrl: "/sign-in" })}
          type="button"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
