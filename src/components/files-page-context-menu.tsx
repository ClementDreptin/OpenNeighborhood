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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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
  const [modalOpen, setModalOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState("");

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

      setModalOpen(true);
      setErrorMessage("");
      setFileName(file.name);

      const axiosConfig: Parameters<typeof axios.post>[2] = {
        onUploadProgress: ({ loaded, total }) => {
          if (total == null) {
            return;
          }

          setUploadProgress(Math.round((loaded * 100) / total));
        },
      };

      axios
        .post(`${pathname}/upload`, formData, axiosConfig)
        .then(() => {
          setModalOpen(false);
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            setErrorMessage(error.message);
          }
        });
    });
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem inset onClick={handleUpload}>
            Upload file
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload progress</DialogTitle>
          <DialogDescription>
            {fileName} is being uploaded to {dirPath}, please wait...
          </DialogDescription>
        </DialogHeader>

        <Progress value={uploadProgress} />

        {errorMessage !== "" ? (
          <p role="alert" className="text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
