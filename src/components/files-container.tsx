"use client";

import * as React from "react";
import { useFilesContext } from "@/contexts/FilesContext";

interface FileContainerProps {
  children: React.ReactNode;
}

export default function FilesContainer({ children }: FileContainerProps) {
  const { setSelectedFiles } = useFilesContext();

  const unselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  return (
    <div className="h-full" onClick={unselectAllFiles}>
      {children}
    </div>
  );
}
