"use client";

import * as React from "react";
import type { File } from "@/lib/consoles";

interface FilesContextValue {
  files: File[];
  clipboardPath: string;
  setClipboardPath: (clipboardPath: string) => void;
}

const FilesContext = React.createContext<FilesContextValue | null>(null);

interface FilesProviderProps extends FilesContextValue {
  children: React.ReactNode;
}

export function FilesProvider({ files, children }: FilesProviderProps) {
  const [clipboardPath, setClipboardPath] = React.useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("clipboardPath") ?? "")
      : "",
  );

  React.useEffect(() => {
    localStorage.setItem("clipboardPath", clipboardPath);
  }, [clipboardPath]);

  return (
    <FilesContext value={{ files, clipboardPath, setClipboardPath }}>
      {children}
    </FilesContext>
  );
}

export function useFilesContext() {
  const context = React.useContext(FilesContext);

  if (context == null) {
    throw new Error("useFilesContext must be within FilesProvider.");
  }

  return context;
}
