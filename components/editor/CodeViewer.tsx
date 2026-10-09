"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { VulnerabilityFinding } from "@/lib/ai/schema";
import type { SeverityFilter } from "@/lib/state/auditStore";

interface CodeViewerProps {
  code: string;
  language: string;
  theme: "light" | "dark";
  findings: VulnerabilityFinding[];
  severityFilter: SeverityFilter;
  selectedIssueIndex: number | null;
  onChange: (code: string) => void;
  onEditorMount?: (editorInstance: editor.IStandaloneCodeEditor) => void;
}

export function CodeViewer({
  code,
  language,
  theme,
  findings,
  severityFilter,
  selectedIssueIndex,
  onChange,
  onEditorMount,
}: CodeViewerProps) {
  const [mountedEditor, setMountedEditor] = useState<{
    editor: editor.IStandaloneCodeEditor;
    monaco: Monaco;
  } | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const handleMount: OnMount = (editorInstance, monaco) => {
    setMountedEditor({ editor: editorInstance, monaco });
    onEditorMount?.(editorInstance);
  };

  useEffect(() => {
    if (!mountedEditor) return;
    const { editor: editorInstance, monaco } = mountedEditor;

    const decorations = findings.flatMap((finding, index) => {
      if (severityFilter !== "ALL" && finding.severity !== severityFilter) {
        return [];
      }

      const severityClass = finding.severity.toLowerCase();
      const selectedClass =
        selectedIssueIndex === index ? " finding-line-selected" : "";
      return [
        {
          range: new monaco.Range(
            finding.lineStart,
            1,
            finding.lineEnd,
            1,
          ),
          options: {
            isWholeLine: true,
            className: `finding-line-${severityClass}${selectedClass}`,
            linesDecorationsClassName: `finding-gutter-${severityClass}`,
            glyphMarginClassName: `finding-glyph-${severityClass}`,
            hoverMessage: {
              value: `**${finding.severity}: ${finding.title}**`,
            },
          },
        },
      ];
    });

    decorationIdsRef.current = editorInstance.deltaDecorations(
      decorationIdsRef.current,
      decorations,
    );

    if (selectedIssueIndex !== null) {
      const selectedFinding = findings[selectedIssueIndex];
      if (selectedFinding) {
        editorInstance.revealLineInCenter(selectedFinding.lineStart);
      }
    }
  }, [findings, mountedEditor, selectedIssueIndex, severityFilter]);

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
        glyphMargin: true,
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
