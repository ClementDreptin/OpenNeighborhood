"use client";

import * as React from "react";
import type { File } from "@/lib/consoles";

interface FilesContextValue {
  files: File[];
}

const FilesContext = React.createContext<FilesContextValue | null>(null);

interface FilesProviderProps extends FilesContextValue {
  children: React.ReactNode;
}

export function FilesProvider({ files, children }: FilesProviderProps) {
  return <FilesContext value={{ files }}>{children}</FilesContext>;
}

export function useFilesContext() {
  const context = React.useContext(FilesContext);

  if (context == null) {
    throw new Error("useFilesContext must be within FilesProvider.");
  }

  return context;
}
