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

interface UploadDropzoneProps {
  children: React.ReactNode;
}

export default function UploadDropzone({ children }: UploadDropzoneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const dirPath = searchParams.get("path") ?? "";
  const { files } = useFilesContext();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
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

    const someFilesAlreadyExist = files.some((file) =>
      acceptedFiles.some(
        (acceptedFile) =>
          acceptedFile.name.toLowerCase() === file.name.toLowerCase(),
      ),
    );

    setSelectedFiles(acceptedFiles);
    if (someFilesAlreadyExist) {
      setConfirmModalOpen(true);
    } else {
      proceedWithUpload(acceptedFiles);
    }
  };

  const confirmUpload = () => {
    setConfirmModalOpen(false);
    proceedWithUpload(selectedFiles);
  };

  const proceedWithUpload = (filesToUpload: File[]) => {
    setModalOpen(true);
    setErrorMessage("");

    const uploadPromises = filesToUpload.map((file) => {
      const formData = new FormData();
      formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
      formData.set("dirPath", dirPath);
      formData.set("file", file);

      return fetch(`${pathname}/upload`, {
        method: "POST",
        body: formData,
      });
    });

    Promise.all(uploadPromises)
      .then((responses) => {
        const failedUploads = responses.filter((response) => !response.ok);

        if (failedUploads.length > 0) {
          throw new Error(
            `${failedUploads.length.toString()} file(s) failed to upload.`,
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
                  Uploading files to <strong>{dirPath}</strong> failed with the
                  following error.
                </>
              ) : (
                <>
                  Files are being uploaded to <strong>{dirPath}</strong>, please
                  wait...
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
              Some files already exist. Would you like to replace them?
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
