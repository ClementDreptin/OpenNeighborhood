"use client";

import * as React from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import { useFilesContext } from "@/contexts/FilesContext";
import { createDirectoryAction } from "@/lib/actions";

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
  const [selectedFiles, setSelectedFiles] = React.useState<FileWithPath[]>([]);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [currentFileName, setCurrentFileName] = React.useState("");
  const [, startTransition] = React.useTransition();
  const isError = errorMessage !== "";

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
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
      void proceedWithUpload(acceptedFiles);
    }
  };

  const confirmUpload = () => {
    setConfirmModalOpen(false);
    void proceedWithUpload(selectedFiles);
  };

  const proceedWithUpload = async (filesToUpload: FileWithPath[]) => {
    setModalOpen(true);

    const directories = new Set<string>();

    filesToUpload.forEach((file) => {
      let currentPath = pathDirname(file.path ?? "");

      while (currentPath !== "") {
        directories.add(currentPath);
        currentPath = pathDirname(currentPath);
      }
    });

    const sortedDirectories = Array.from(directories).sort((a, b) => {
      const depthA = a.split("/").length;
      const depthB = b.split("/").length;
      return depthA - depthB;
    });

    try {
      for (const directory of sortedDirectories) {
        const formData = new FormData();
        formData.set(
          "ipAddress",
          typeof ipAddress === "string" ? ipAddress : "",
        );
        formData.set("parentPath", dirPath);
        formData.set("dirname", directory);

        const result = await createDirectoryAction(formData);
        if (result.error != null) {
          throw result.error;
        }
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentFileName(file.name);
        setUploadProgress(i);

        const fileDir = pathDirname(file.path ?? "");

        const formData = new FormData();
        formData.set(
          "ipAddress",
          typeof ipAddress === "string" ? ipAddress : "",
        );
        formData.set("dirPath", `${dirPath}\\${fileDir}`);
        formData.set("file", file);

        const response = await fetch(`${pathname}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      setModalOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
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

          {!isError ? (
            <div className="flex flex-col gap-2">
              <p>
                Uploading <strong>{currentFileName}</strong>...
              </p>
              <p>
                {uploadProgress.toLocaleString()}&nbsp;/&nbsp;
                {selectedFiles.length.toLocaleString()}
              </p>
              <Progress value={(uploadProgress / selectedFiles.length) * 100} />
            </div>
          ) : (
            <p role="alert" className="text-destructive">
              {errorMessage}
            </p>
          )}
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

function pathDirname(path: string) {
  const separator = "/";

  // When a directory is dropped, the files at its root will have a path that looks
  // like "./<filename>", so if we split on "/" we get [".", "<filename>"], which is
  // why we need to filter out the "."
  const parts = path
    .split(separator)
    .filter((part) => part !== "" && part !== ".");

  // The last part is the file name so we remove it
  parts.pop();

  return parts.join(separator);
}
