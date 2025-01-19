"use client";

import * as React from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
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

interface FilesPageContextMenuProps {
  children: React.ReactNode;
}

export default function FilesPageContextMenu({
  children,
}: FilesPageContextMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const dirPath = searchParams.get("path") ?? "";
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [, startTransition] = React.useTransition();
  const isError = errorMessage !== "";

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

      setUploadModalOpen(true);
      setErrorMessage("");
      setFileName(file.name);

      fetch(`${pathname}/upload`, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Request failed with status code ${response.status.toString()}.`,
            );
          }

          setUploadModalOpen(false);
          startTransition(() => {
            router.refresh();
          });
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            setErrorMessage(error.message);
          }
        });
    });
  };

  const preventClose = (event: Event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem inset onClick={handleUpload}>
            Upload file
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent
        displayCloseButton={isError}
        onInteractOutside={!isError ? preventClose : undefined}
        onEscapeKeyDown={!isError ? preventClose : undefined}
        onOpenAutoFocus={preventClose}
      >
        <DialogHeader>
          <DialogTitle>Upload progress</DialogTitle>
          <DialogDescription>
            {isError
              ? `Uploading ${fileName} to ${dirPath} failed with the following error.`
              : `${fileName} is being uploaded to ${dirPath}, please wait...`}
          </DialogDescription>
        </DialogHeader>

        {!isError && (
          <div className="m-auto">
            <ReloadIcon className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError ? (
          <p role="alert" className="text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
