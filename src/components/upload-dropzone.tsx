"use client";

import * as React from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import { usePathname, useRouter } from "next/navigation";
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
import { useDirPath, useIpAddress } from "@/lib/hooks";
import { getPathParts, pathDirname } from "@/lib/utils";

interface UploadDropzoneProps {
  children: React.ReactNode;
}

export default function UploadDropzone({ children }: UploadDropzoneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ipAddress = useIpAddress();
  const dirPath = useDirPath();
  const { files } = useFilesContext();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<FileWithPath[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [directoriesToCreate, setDirectoriesToCreate] = React.useState<
    string[]
  >([]);
  const [directoryCreationProgress, setDirectoryCreationProgress] =
    React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState("");
  const isError = errorMessage !== "";
  const [, startTransition] = React.useTransition();

  const containsDuplicateFiles = (acceptedFiles: FileWithPath[]) => {
    const rootFileNames = getRootFileNames(acceptedFiles);

    return files.some((file) =>
      rootFileNames.some(
        (rootFileName) =>
          rootFileName.toLowerCase() === file.name.toLowerCase(),
      ),
    );
  };

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    setSelectedFiles(acceptedFiles);
    if (acceptedFiles.length === 0) {
      return;
    }

    if (containsDuplicateFiles(acceptedFiles)) {
      setConfirmModalOpen(true);
    } else {
      void proceedWithUpload(acceptedFiles);
    }
  };

  const deleteDuplicateDirectories = async () => {
    const existingDirectories = files.filter((file) => file.isDirectory);
    const rootFileNames = getRootFileNames(selectedFiles);

    const formData = new FormData();
    formData.set("ipAddress", ipAddress);
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

    return { success: true };
  };

  const confirmUpload: FormAction = async () => {
    const result = await deleteDuplicateDirectories();
    if (!result.success) {
      return result;
    }

    setConfirmModalOpen(false);
    void proceedWithUpload(selectedFiles);

    return { success: true };
  };

  const createDirectoryStructure = async (filesToUpload: FileWithPath[]) => {
    const directories = getDirectories(filesToUpload);
    setDirectoriesToCreate(directories);

    const formData = new FormData();
    formData.set("ipAddress", ipAddress);

    for (let i = 0; i < directories.length; i++) {
      const directory = directories[i];
      setDirectoryCreationProgress(i);

      formData.set("parentPath", dirPath);
      formData.set("dirName", directory);

      const result = await createDirectoryAction(formData);
      if (result.errorMessage != null) {
        throw new Error(result.errorMessage);
      }
    }

    setDirectoriesToCreate([]);
  };

  const uploadFiles = async (filesToUpload: FileWithPath[]) => {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(i);

      const fileDir = pathDirname(file.path ?? "", "/");

      const formData = new FormData();
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
  };

  const proceedWithUpload = async (filesToUpload: FileWithPath[]) => {
    setModalOpen(true);

    try {
      await createDirectoryStructure(filesToUpload);
      await uploadFiles(filesToUpload);

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
    <div {...getRootProps()} className="relative flex-grow">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="bg-opacity-50 absolute inset-0 rounded-md bg-gray-600" />
      )}

      {children}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          showCloseButton={isError}
          onInteractOutside={!isError ? preventClose : undefined}
          onEscapeKeyDown={!isError ? preventClose : undefined}
          onOpenAutoFocus={preventClose}
        >
          {isError ? (
            <ErrorModalContent message={errorMessage} />
          ) : directoriesToCreate.length > 0 ? (
            <DirectoryCreationModalContent
              names={directoriesToCreate}
              progress={directoryCreationProgress}
            />
          ) : (
            <UploadModalContent
              files={selectedFiles}
              progress={uploadProgress}
            />
          )}
        </DialogContent>
      </Dialog>

      <ActionModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        action={confirmUpload}
        description="Some files already exist. Would you like to replace them?"
      />
    </div>
  );
}

interface DirectoryCreationModalContentProps {
  names: string[];
  progress: number;
}

function DirectoryCreationModalContent({
  names,
  progress,
}: DirectoryCreationModalContentProps) {
  const dirPath = useDirPath();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload progress</DialogTitle>
        <DialogDescription>
          Creating directories in <strong>{dirPath}</strong>, please wait...
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <p>
          Creating directory <strong>{names[progress]}</strong>...
        </p>
        <p>
          {progress.toLocaleString()}&nbsp;/&nbsp;
          {names.length.toLocaleString()}
        </p>
        <Progress value={(progress / names.length) * 100} />
      </div>
    </>
  );
}

interface UploadModalContentProps {
  files: FileWithPath[];
  progress: number;
}

function UploadModalContent({ files, progress }: UploadModalContentProps) {
  const dirPath = useDirPath();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload progress</DialogTitle>
        <DialogDescription>
          Files are being uploaded to <strong>{dirPath}</strong>, please wait...
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <p>
          Uploading <strong>{files[progress].name}</strong>...
        </p>
        <p>
          {progress.toLocaleString()}&nbsp;/&nbsp;
          {files.length.toLocaleString()}
        </p>
        <Progress value={(progress / files.length) * 100} />
      </div>
    </>
  );
}

interface ErrorModalContentProps {
  message: string;
}

function ErrorModalContent({ message }: ErrorModalContentProps) {
  const dirPath = useDirPath();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload progress</DialogTitle>
        <DialogDescription>
          Uploading files to <strong>{dirPath}</strong> failed with the
          following error.
        </DialogDescription>
      </DialogHeader>

      <p role="alert" className="text-destructive">
        {message}
      </p>
    </>
  );
}

function getDirectories(files: FileWithPath[]) {
  // For a list of files, extract all the directories
  //
  // /dir1/dir2/file2.txt      /dir1
  // /dir1/dir2/file3.txt  =>  /dir1/dir2
  // /dir1/dir3/file4.txt      /dir1/dir3
  // /dir1/dir3/file5.txt
  // /dir1/file.txt

  const directories = new Set<string>();

  // Recursively get all the parent directories of each files
  files.forEach((file) => {
    let currentPath = pathDirname(file.path ?? "", "/");

    while (currentPath !== "") {
      directories.add(currentPath);
      currentPath = pathDirname(currentPath, "/");
    }
  });

  // Sort the directories by depth
  //
  // /dir1/dir2           /dir1
  // /dir1            =>  /dir1/dir2
  // /dir1/dir2/dir3      /dir1/dir2/dir3

  const sortedDirectories = Array.from(directories).sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    return depthA - depthB;
  });

  return sortedDirectories;
}

function getRootFileNames(files: FileWithPath[]) {
  // For a list of files, extract all the file and directory names
  // at the root
  //
  // /dir1/dir2/file3.txt      dir1
  // /dir1/file2.txt       =>  file1.txt
  // file1.txt

  const rootFileNames = new Set<string>();

  for (const file of files) {
    const parts = getPathParts(file.path ?? "");
    if (parts.length > 0) {
      rootFileNames.add(parts[0]);
    }
  }

  return Array.from(rootFileNames);
}
