import { Check, Circle } from "lucide-react";
import type { WorkspaceFile } from "@/types/repository";

interface StatusBarProps {
  code: string;
  file: WorkspaceFile | null;
  isDirty: boolean;
}

export function StatusBar({ code, file, isDirty }: StatusBarProps) {
  const lineCount = code.length === 0 ? 1 : code.split(/\r\n|\r|\n/).length;

  return (
    <footer className="status-bar">
      <div className="status-group">
        <span className="status-online">
          <span aria-hidden="true" className="status-dot" />
          Workspace ready
        </span>
        <span>{file?.source === "github" ? "GitHub" : file ? "Local file" : "No file selected"}</span>
      </div>
      <div className="status-group">
        <span>{lineCount} lines</span>
        <span>{file?.language ?? "typescript"}</span>
        <span className="status-online">
          {isDirty ? (
            <Circle aria-hidden="true" size={9} />
          ) : (
            <Check aria-hidden="true" size={11} />
          )}
          {isDirty ? "Unsaved edits" : "Ready"}
        </span>
      </div>
    </footer>
  );
}
