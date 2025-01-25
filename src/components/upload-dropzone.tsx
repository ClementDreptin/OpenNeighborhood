"use client";

import * as React from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import ActionModal from "@/components/action-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useFilesContext } from "@/contexts/FilesContext";
import {
  createDirectoryAction,
  deleteFileAction,
  type FormAction,
} from "@/lib/actions";

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
  const [currentFileName, setCurrentFileName] = React.useState("");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [directoriesToCreate, setDirectoriesToCreate] = React.useState<
    string[]
  >([]);
  const [directoryCreationProgress, setDirectoryCreationProgress] =
    React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState("");
  const isError = errorMessage !== "";
  const [, startTransition] = React.useTransition();

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const rootFileNames = getRootFileNames(acceptedFiles);
    const someFilesAlreadyExist = files.some((file) =>
      rootFileNames.some(
        (rootFileName) =>
          rootFileName.toLowerCase() === file.name.toLowerCase(),
      ),
    );

    setSelectedFiles(acceptedFiles);
    if (someFilesAlreadyExist) {
      setConfirmModalOpen(true);
    } else {
      void proceedWithUpload(acceptedFiles);
    }
  };

  const confirmUpload: FormAction = async () => {
    const existingDirectories = files.filter((file) => file.isDirectory);
    const rootFileNames = getRootFileNames(selectedFiles);

    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("isDirectory", "true");

    for (const directory of existingDirectories) {
      for (const selectedFile of rootFileNames) {
        if (directory.name === selectedFile) {
          formData.set(
            "filePath",
            (!dirPath.endsWith("\\") ? `${dirPath}\\` : dirPath) +
              directory.name,
          );

          const result = await deleteFileAction(formData);
          if (!result.success) {
            return result;
          }
        }
      }
    }

    setConfirmModalOpen(false);
    void proceedWithUpload(selectedFiles);

    return { success: true };
  };

  const proceedWithUpload = async (filesToUpload: FileWithPath[]) => {
    setModalOpen(true);

    const directories = getDirectories(filesToUpload);
    setDirectoriesToCreate(directories);

    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");

    try {
      for (let i = 0; i < directories.length; i++) {
        const directory = directories[i];
        formData.set("parentPath", dirPath);
        formData.set("dirname", directory);

        const result = await createDirectoryAction(formData);
        if (result.error != null) {
          throw result.error;
        }

        setDirectoryCreationProgress(i);
      }
      setDirectoriesToCreate([]);

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentFileName(file.name);

        const fileDir = pathDirname(file.path ?? "");

        formData.set("dirPath", `${dirPath}\\${fileDir}`);
        formData.set("file", file);

        const response = await fetch(`${pathname}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setUploadProgress(i);
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
              ) : directoriesToCreate.length > 0 ? (
                <>
                  Creating directories in <strong>{dirPath}</strong>, please
                  wait...
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
              {directoriesToCreate.length > 0 ? (
                <>
                  <p>
                    Creating directory{" "}
                    <strong>
                      {directoriesToCreate[directoryCreationProgress]}
                    </strong>
                    ...
                  </p>
                  <p>
                    {directoryCreationProgress.toLocaleString()}&nbsp;/&nbsp;
                    {directoriesToCreate.length.toLocaleString()}
                  </p>
                  <Progress
                    value={
                      (directoryCreationProgress / directoriesToCreate.length) *
                      100
                    }
                  />
                </>
              ) : (
                <>
                  <p>
                    Uploading <strong>{currentFileName}</strong>...
                  </p>
                  <p>
                    {uploadProgress.toLocaleString()}&nbsp;/&nbsp;
                    {selectedFiles.length.toLocaleString()}
                  </p>
                  <Progress
                    value={(uploadProgress / selectedFiles.length) * 100}
                  />
                </>
              )}
            </div>
          ) : (
            <p role="alert" className="text-destructive">
              {errorMessage}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm upload modal */}
      <ActionModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        action={confirmUpload}
        description="Some files already exist. Would you like to replace them?"
      />
    </div>
  );
}

function getPathParts(path: string) {
  // When a directory is dropped, the files at its root will have a path that looks
  // like "./<filename>", so if we split on "/" we get [".", "<filename>"], which is
  // why we need to filter out the "."
  return path.split("/").filter((part) => part !== "" && part !== ".");
}

function pathDirname(path: string) {
  const parts = getPathParts(path);

  // The last part is the file name so we remove it
  parts.pop();

  return parts.join("/");
}

function getDirectories(files: FileWithPath[]) {
  const directories = new Set<string>();

  files.forEach((file) => {
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

  return sortedDirectories;
}

function getRootFileNames(files: FileWithPath[]) {
  const rootFileNames = new Set<string>();

  for (const file of files) {
    const parts = getPathParts(file.path ?? "");
    if (parts.length > 0) {
      rootFileNames.add(parts[0]);
    }
  }

  return Array.from(rootFileNames);
}
