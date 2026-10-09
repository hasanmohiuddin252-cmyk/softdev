"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";

interface SplitPaneLayoutProps {
  editorWidth: number;
  onEditorWidthChange: (width: number) => void;
  editor: ReactNode;
  dashboard: ReactNode;
}

export function SplitPaneLayout({
  editorWidth,
  onEditorWidthChange,
  editor,
  dashboard,
}: SplitPaneLayoutProps) {
  function resizeFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;

    const percent = ((event.clientX - bounds.left) / bounds.width) * 100;
    onEditorWidthChange(Math.min(76, Math.max(36, percent)));
  }

  function resizeFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -2 : 2;
    onEditorWidthChange(Math.min(76, Math.max(36, editorWidth + direction)));
  }

  const layoutStyle: CSSProperties & { "--editor-width": string } = {
    "--editor-width": `${editorWidth}%`,
  };

  return (
    <div className="workspace-grid" style={layoutStyle}>
      {editor}
      <div
        aria-label="Resize editor and audit panels"
        aria-orientation="vertical"
        aria-valuemax={76}
        aria-valuemin={36}
        aria-valuenow={Math.round(editorWidth)}
        className="splitter"
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={resizeFromPointer}
        onKeyDown={resizeFromKeyboard}
        role="separator"
        tabIndex={0}
      />
      {dashboard}
    </div>
  );
}
