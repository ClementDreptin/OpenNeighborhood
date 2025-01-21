"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";

interface FilesPageDropzoneProps {
  children: React.ReactNode;
}

export default function FilesPageDropzone({
  children,
}: FilesPageDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone();

  return (
    <div {...getRootProps()} className="relative h-full">
      <input {...getInputProps()} />

      {!isDragActive && (
        <div className="absolute inset-0 rounded-md bg-gray-600 bg-opacity-50" />
      )}

      {children}
    </div>
  );
}
