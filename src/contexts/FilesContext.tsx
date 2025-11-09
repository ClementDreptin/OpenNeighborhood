"use client";

import * as React from "react";
import type { File } from "@/lib/consoles";

interface FilesContextValue {
  files: File[];
  selectedFiles: Set<File>;
  setSelectedFiles: (selectedFiles: Set<File>) => void;
  clipboardPath: string;
  setClipboardPath: (clipboardPath: string) => void;
}

const FilesContext = React.createContext<FilesContextValue | null>(null);

interface FilesProviderProps {
  files: File[];
  children: React.ReactNode;
}

export function FilesProvider({ files, children }: FilesProviderProps) {
  const [selectedFiles, setSelectedFiles] = React.useState(new Set<File>());
  const [clipboardPath, setClipboardPath] = React.useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("clipboardPath") ?? "")
      : "",
  );

  React.useEffect(() => {
    localStorage.setItem("clipboardPath", clipboardPath);
  }, [clipboardPath]);

  const value: FilesContextValue = {
    files,
    selectedFiles,
    setSelectedFiles,
    clipboardPath,
    setClipboardPath,
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
