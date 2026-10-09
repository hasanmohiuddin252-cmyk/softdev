"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface CodeViewerProps {
  code: string;
  language: string;
  theme: "light" | "dark";
  onChange: (code: string) => void;
  onEditorMount?: (editorInstance: editor.IStandaloneCodeEditor) => void;
}

export function CodeViewer({
  code,
  language,
  theme,
  onChange,
  onEditorMount,
}: CodeViewerProps) {
  const handleMount: OnMount = (editorInstance) => {
    onEditorMount?.(editorInstance);
  };

  return (
    <Editor
      height="100%"
      language={language}
      onChange={(value) => onChange(value ?? "")}
      onMount={handleMount}
      options={{
        automaticLayout: true,
        fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace",
        fontSize: 13,
        lineHeight: 21,
        lineNumbers: "on",
        minimap: { enabled: false },
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        wordWrap: "on",
      }}
      theme={theme === "dark" ? "vs-dark" : "vs"}
      value={code}
    />
  );
}
