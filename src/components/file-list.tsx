"use client";

import * as React from "react";
import FileButton from "@/components/file-button";
import { useFilesContext } from "@/contexts/files-context";
import type { File } from "@/lib/consoles";

export default function FileList() {
  const backgroundRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const { files, selectedFiles, setSelectedFiles } = useFilesContext();
  const [lastSelectedFile, setLastSelectedFile] = React.useState<File | null>(
    null,
  );

  const selectFile = (event: React.MouseEvent, file: File) => {
    // Don't select the file on right click
    if (event.button === 2) {
      return;
    }

    if (event.ctrlKey) {
      const newSelectedFiles = new Set(selectedFiles);
      newSelectedFiles.add(file);
      setSelectedFiles(newSelectedFiles);
      setLastSelectedFile(file);

      return;
    }

    if (event.shiftKey && lastSelectedFile != null) {
      const newSelectedFiles = new Set<File>();
      const startIndex = files.indexOf(lastSelectedFile);
      const endIndex = files.indexOf(file);
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);

      for (let i = start; i <= end; i++) {
        newSelectedFiles.add(files[i]);
      }

      setSelectedFiles(newSelectedFiles);
      setLastSelectedFile(file);

      return;
    }

    setSelectedFiles(new Set([file]));
    setLastSelectedFile(file);
  };

  const unselectAllFiles: React.MouseEventHandler = (event) => {
    const clickedOnBackgroundOrGrid =
      event.target === backgroundRef.current ||
      event.target === gridRef.current;
    if (!clickedOnBackgroundOrGrid) {
      return;
    }

    setSelectedFiles(new Set());
    setLastSelectedFile(null);
  };

  return (
    <div
      ref={backgroundRef}
      className="h-full"
      onClick={unselectAllFiles}
      onContextMenu={unselectAllFiles}
    >
      {files.length > 0 ? (
        <div
          ref={gridRef}
          className="grid-cols-autofill grid auto-rows-min gap-4"
        >
          {files.map((file) => (
            <FileButton
              key={file.name}
              file={file}
              onMouseDown={(event) => {
                selectFile(event, file);
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-center">This folder is empty.</p>
      )}
    </div>
  );
}
