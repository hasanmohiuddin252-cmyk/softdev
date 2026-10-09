"use client";

import { useEffect, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Check, X } from "lucide-react";
import type { Theme } from "@/components/layout/ThemeToggle";

interface DiffViewerModalProps {
  isOpen: boolean;
  originalCode: string;
  modifiedCode: string;
  language: string;
  theme: Theme;
  onClose: () => void;
  onAccept: (code: string) => void;
}

export function DiffViewerModal({
  isOpen,
  originalCode,
  modifiedCode,
  language,
  theme,
  onClose,
  onAccept,
}: DiffViewerModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className="diff-modal-backdrop"
      onMouseDown={(event) => {
        if (isOpen && event.target === event.currentTarget) onClose();
      }}
      style={{ display: isOpen ? "grid" : "none" }}
    >
      <section
        aria-labelledby="diff-modal-title"
        aria-modal="true"
        className="diff-modal"
        role="dialog"
      >
        <header className="diff-modal-header">
          <div>
            <h2 id="diff-modal-title">Review suggested security patch</h2>
            <p>Original code on the left · Proposed patch on the right</p>
          </div>
          <button
            aria-label="Close patch review"
            className="diff-close-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>
        <div className="diff-editor">
          <DiffEditor
            language={language}
            original={originalCode}
            modified={modifiedCode}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              readOnly: true,
              renderSideBySide: true,
              scrollBeyondLastLine: false,
            }}
            theme={theme === "dark" ? "vs-dark" : "vs"}
          />
        </div>
        <footer className="diff-modal-footer">
          <p>Review the full change before applying it to your working file.</p>
          <div>
            <button className="button diff-discard-button" onClick={onClose} type="button">
              Discard patch
            </button>
            <button
              className="button button-primary diff-accept-button"
              onClick={() => onAccept(modifiedCode)}
              type="button"
            >
              <Check aria-hidden="true" size={14} />
              Accept and apply
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
