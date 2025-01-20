"use client";

import * as React from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFilesContext } from "@/contexts/FilesContext";

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
  const { files } = useFilesContext();
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [confirmUploadModalOpen, setConfirmUploadModalOpen] =
    React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [, startTransition] = React.useTransition();
  const isError = errorMessage !== "";

  const pickFile = () => {
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

      setErrorMessage("");
      setSelectedFile(file);

      const fileAlreadyExists = files.some(
        // Xbox file names are not case sensitive, just like Windows...
        ({ name }) => name.toLowerCase() === file.name.toLocaleLowerCase(),
      );

      if (fileAlreadyExists) {
        setConfirmUploadModalOpen(true);
        return;
      }

      proceedWithUpload(formData);
    });
  };

  const confirmUpload = () => {
    if (selectedFile == null) {
      throw new Error("'selectedFile' is null, this should not happen.");
    }

    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("dirPath", dirPath);
    formData.set("file", selectedFile);

    setConfirmUploadModalOpen(false);
    proceedWithUpload(formData);
  };

  const proceedWithUpload = (formData: FormData) => {
    setUploadModalOpen(true);

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
  };

  const preventClose = (event: Event) => {
    event.preventDefault();
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem inset onClick={pickFile}>
            Upload file
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Upload progress modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent
          displayCloseButton={isError}
          onInteractOutside={!isError ? preventClose : undefined}
          onEscapeKeyDown={!isError ? preventClose : undefined}
          onOpenAutoFocus={preventClose}
        >
          <DialogHeader>
            <DialogTitle>Upload progress</DialogTitle>
            <DialogDescription>
              {isError ? (
                <>
                  Uploading <strong>{selectedFile?.name}</strong> to{" "}
                  <strong>{dirPath}</strong> failed with the following error.
                </>
              ) : (
                <>
                  <strong>{selectedFile?.name}</strong> is being uploaded to{" "}
                  <strong>{dirPath}</strong>, please wait...
                </>
              )}
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

      {/* Confirm upload modal */}
      <Dialog
        open={confirmUploadModalOpen}
        onOpenChange={setConfirmUploadModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>
              <strong>{selectedFile?.name}</strong> already exists, would you
              like to replace the existing file?
            </DialogDescription>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">No</Button>
              </DialogClose>
              <Button onClick={confirmUpload}>Yes</Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
