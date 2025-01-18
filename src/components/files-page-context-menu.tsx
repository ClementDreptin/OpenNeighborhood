"use client";

import * as React from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FilesPageContextMenuProps {
  children: React.ReactNode;
}

export default function FilesPageContextMenu({
  children,
}: FilesPageContextMenuProps) {
  const pathname = usePathname();
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const dirPath = searchParams.get("path") ?? "";

  const handleUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.click();

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file == null) {
        return;
      }

      const formData = new FormData();
      formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
      formData.set("dirPath", dirPath);
      formData.set("file", file);

      axios
        .post(`${pathname}/upload`, formData, {
          onUploadProgress: ({ loaded, total }) => {
            if (total == null) {
              console.log("total is undefined");
              return;
            }

            const progress = Math.round((loaded * 100) / total);
            console.log(`${progress.toString()}%`);
          },
        })
        .catch(console.error)
        .finally(() => {
          console.log("done");
        });
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem inset onClick={handleUpload}>
          Upload file
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
