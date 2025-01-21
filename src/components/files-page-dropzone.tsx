"use client";

import * as React from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
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
import { displayErrorToast } from "@/lib/utils";

interface FilesPageDropzoneProps {
  children: React.ReactNode;
}

export default function FilesPageDropzone({
  children,
}: FilesPageDropzoneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const dirPath = searchParams.get("path") ?? "";
  const { files } = useFilesContext();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [, startTransition] = React.useTransition();
  const isError = errorMessage !== "";

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const containsDirectory = acceptedFiles.some(
      (file) => file.path?.indexOf("/") !== file.path?.lastIndexOf("/"),
    );
    if (containsDirectory) {
      displayErrorToast("Uploading a directory isn't supported yet.");
      return;
    }

    if (acceptedFiles.length > 1) {
      displayErrorToast("Uploading multiple files isn't supported yet.");
      return;
    }

    const file = acceptedFiles[0];

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
      setConfirmModalOpen(true);
      return;
    }

    proceedWithUpload(formData);
  };

  const confirmUpload = () => {
    if (selectedFile == null) {
      throw new Error("'selectedFile' is null, this should not happen.");
    }

    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("dirPath", dirPath);
    formData.set("file", selectedFile);

    setConfirmModalOpen(false);
    proceedWithUpload(formData);
  };

  const proceedWithUpload = (formData: FormData) => {
    setModalOpen(true);

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

        setModalOpen(false);
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

      {/* Upload progress modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
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
    </div>
  );
}
