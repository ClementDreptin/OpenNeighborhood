"use client";

import * as React from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import { displayErrorToast } from "@/lib/utils";

interface FilesPageDropzoneProps {
  children: React.ReactNode;
}

export default function FilesPageDropzone({
  children,
}: FilesPageDropzoneProps) {
  const onDrop = (files: FileWithPath[]) => {
    if (files.length === 0) {
      return;
    }

    const containsDirectory = files.some(
      (file) => file.path?.indexOf("/") !== file.path?.lastIndexOf("/"),
    );
    if (containsDirectory) {
      displayErrorToast("Uploading a directory isn't supported yet.");
      return;
    }

    if (files.length > 1) {
      displayErrorToast("Uploading multiple files isn't supported yet.");
      return;
    }

    console.log(files);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div {...getRootProps()} className="relative h-full">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 rounded-md bg-gray-600 bg-opacity-50" />
      )}

      {children}
    </div>
  );
}
