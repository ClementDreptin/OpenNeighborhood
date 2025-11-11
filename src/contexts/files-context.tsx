"use client";

import * as React from "react";
import type { File } from "@/lib/consoles";

const CLIPBOARD_PATHS_KEY = "clipboardPaths";

interface FilesContextValue {
  files: File[];
  selectedFiles: Set<File>;
  setSelectedFiles: (selectedFiles: Set<File>) => void;
  clipboardPaths: string[];
  setClipboardPaths: (clipboardPaths: string[]) => void;
}

const FilesContext = React.createContext<FilesContextValue | null>(null);

interface FilesProviderProps {
  files: File[];
  children: React.ReactNode;
}

export function FilesProvider({ files, children }: FilesProviderProps) {
  const [selectedFiles, setSelectedFiles] = React.useState(new Set<File>());
  const [clipboardPaths, setClipboardPaths] = React.useState(
    getClipboardPathsFromLocalStorage(),
  );

  React.useEffect(() => {
    localStorage.setItem(CLIPBOARD_PATHS_KEY, JSON.stringify(clipboardPaths));
  }, [clipboardPaths]);

  const value: FilesContextValue = {
    files,
    selectedFiles,
    setSelectedFiles,
    clipboardPaths,
    setClipboardPaths,
  };

  return <FilesContext value={value}>{children}</FilesContext>;
}

export function useFilesContext() {
  const context = React.useContext(FilesContext);

  if (context == null) {
    throw new Error("useFilesContext must be within FilesProvider.");
  }

  return context;
}

function getClipboardPathsFromLocalStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  const clipboardPathsFromLocalStorage =
    localStorage.getItem(CLIPBOARD_PATHS_KEY);
  if (clipboardPathsFromLocalStorage == null) {
    return [];
  }

  const parsed = JSON.parse(clipboardPathsFromLocalStorage) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Unexpected clipboard paths structure");
  }

  const allClipboardPathsAreStrings = parsed.every(
    (path) => typeof path === "string",
  );
  if (!allClipboardPathsAreStrings) {
    throw new Error("Unexpected clipboard paths structure");
  }

  return parsed;
}
