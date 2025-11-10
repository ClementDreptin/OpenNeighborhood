"use client";

import * as React from "react";
import FileButton from "@/components/file-button";
import { useFilesContext } from "@/contexts/files-context";
import type { File } from "@/lib/consoles";

export default function FileList() {
  const { files, selectedFiles, setSelectedFiles } = useFilesContext();
  const [lastSelectedFile, setLastSelectedFile] = React.useState<File | null>(
    null,
  );

  const selectFile = (event: React.MouseEvent, file: File) => {
    // Prevent the click handler from the parent, which unselects all the files,
    // from tiggering
    event.stopPropagation();

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

  const unselectAllFiles = () => {
    setSelectedFiles(new Set());
    setLastSelectedFile(null);
  };

  return (
    <div className="h-full" onClick={unselectAllFiles}>
      {files.length > 0 ? (
        <div className="grid-cols-autofill grid auto-rows-min gap-4">
          {files.map((file) => (
            <FileButton
              key={file.name}
              file={file}
              selected={selectedFiles.has(file)}
              onClick={(event) => {
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
