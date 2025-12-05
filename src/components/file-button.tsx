"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { IconButton } from "./ui/icon-button";
import directoryIcon from "@/../public/directory.svg";
import fileIcon from "@/../public/file.svg";
import xexIcon from "@/../public/xex.svg";
import ActionModal from "@/components/action-modal";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogDescription,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFilesContext } from "@/contexts/files-context";
import {
  deleteFileAction,
  launchXexAction,
  renameFileAction,
} from "@/lib/actions";
import type { File } from "@/lib/consoles";
import {
  useActionToast,
  useDirPath,
  useIpAddress,
  useModifierKeyLabel,
  usePlatform,
} from "@/lib/hooks";
import { bytesToSize, unixTimeToString } from "@/lib/utils";

interface FileButtonProps {
  file: File;
  onMouseDown: React.MouseEventHandler;
}

export default function FileButton({ file, onMouseDown }: FileButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ipAddress = useIpAddress();
  const parentPath = useDirPath();
  const platform = usePlatform();
  const modifierKeyLabel = useModifierKeyLabel();
  const { selectedFiles, setClipboardPaths } = useFilesContext();
  const fullPath = `${parentPath}\\${file.name}`;
  const [propertiesModalOpen, setPropertiesModalOpen] = React.useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] =
    React.useState(false);
  const [renameModalOpen, setRenameModalOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(file.name);
  const launchXex = useActionToast(launchXexAction);

  const icon = file.isDirectory
    ? (directoryIcon as StaticImageData)
    : file.isXex
      ? (xexIcon as StaticImageData)
      : (fileIcon as StaticImageData);

  const handleDoubleClick = () => {
    if (file.isDirectory) {
      router.push(`${pathname}?${new URLSearchParams({ path: fullPath })}`);
    }
  };

  const handleLaunch = () => {
    const formData = new FormData();
    formData.set("ipAddress", ipAddress);
    formData.set("filePath", fullPath);

    launchXex(formData);
  };

  const handleDownload = () => {
    const filesToDownload =
      selectedFiles.size !== 0 ? Array.from(selectedFiles) : [file];

    for (const fileToDownload of filesToDownload) {
      const fullPath = `${parentPath}\\${fileToDownload.name}`;

      const url = new URL(
        `${window.location.pathname}/download`,
        window.location.origin,
      );
      url.searchParams.set("path", fullPath);
      url.searchParams.set(
        "isDirectory",
        fileToDownload.isDirectory.toString(),
      );

      const link = document.createElement("a");
      link.href = url.toString();
      link.download = fileToDownload.name;
      link.click();
    }
  };

  const handleCut = () => {
    const filesToCut =
      selectedFiles.size !== 0 ? Array.from(selectedFiles) : [file];
    const paths = filesToCut.map((file) => `${parentPath}\\${file.name}`);
    setClipboardPaths(paths);
  };

  const handleDelete = async () => {
    const filesToDelete =
      selectedFiles.size !== 0 ? Array.from(selectedFiles) : [file];

    for (const fileToDelete of filesToDelete) {
      const fullPath = `${parentPath}\\${fileToDelete.name}`;

      const formData = new FormData();
      formData.set("ipAddress", ipAddress);
      formData.set("filePath", fullPath);
      formData.set("isDirectory", fileToDelete.isDirectory.toString());

      const result = await deleteFileAction(formData);
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  };

  const handleRename = () => {
    const newPath = `${parentPath}\\${newName}`;

    const formData = new FormData();
    formData.set("ipAddress", ipAddress);
    formData.set("oldName", fullPath);
    formData.set("newName", newPath);

    return renameFileAction(formData);
  };

  const openPropertiesModal = () => {
    setPropertiesModalOpen(true);
  };

  const openConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(true);
  };

  const openRenameModal = () => {
    setRenameModalOpen(true);
  };

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    const isModifierKeyPressed =
      platform === "mac" ? event.metaKey : event.ctrlKey;

    if (isModifierKeyPressed && event.key === "x") {
      handleCut();
    } else if (event.key === "F2") {
      openRenameModal();
    } else if (event.key === "Delete") {
      openConfirmDeleteModal();
    } else if (event.altKey && event.key === "Enter") {
      openPropertiesModal();
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <IconButton
            title={file.name}
            iconSrc={icon}
            selected={selectedFiles.has(file)}
            onMouseDown={onMouseDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
          >
            {file.name}
          </IconButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {file.isXex && selectedFiles.size < 2 && (
            <ContextMenuItem className="font-bold" inset onClick={handleLaunch}>
              Launch
            </ContextMenuItem>
          )}
          <ContextMenuItem inset onClick={handleDownload}>
            Download
          </ContextMenuItem>

          <Separator />

          <ContextMenuItem inset onClick={handleCut}>
            Cut
            <ContextMenuShortcut>{modifierKeyLabel}+X</ContextMenuShortcut>
          </ContextMenuItem>

          <Separator />

          {selectedFiles.size < 2 && (
            <ContextMenuItem inset onClick={openRenameModal}>
              Rename
              <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          <ContextMenuItem inset onClick={openConfirmDeleteModal}>
            Delete
            <ContextMenuShortcut>Suppr</ContextMenuShortcut>
          </ContextMenuItem>

          {selectedFiles.size < 2 && (
            <>
              <Separator />

              <ContextMenuItem inset onClick={openPropertiesModal}>
                Properties
                <ContextMenuShortcut>Alt+Enter</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <ActionModal
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
        action={handleDelete}
        description={
          selectedFiles.size > 1 ? (
            <>
              Are you sure you want to delete these{" "}
              {selectedFiles.size.toLocaleString()} items?
            </>
          ) : (
            <>
              Are you sure you want to delete <strong>{file.name}</strong>
              {file.isDirectory ? " and all of its contents" : ""}?
            </>
          )
        }
      />

      <ActionModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        action={handleRename}
        title={`Rename ${file.isDirectory ? "directory" : "file"}`}
        description={
          <>
            Enter the new name of <strong>{file.name}</strong>.
          </>
        }
        actions={{
          cancel: "Cancel",
          submit: "Confirm",
        }}
      >
        {({ isError, isPending }) => (
          <>
            <label htmlFor="rename-input" className="sr-only">
              New {file.isDirectory ? "directory" : "file"} name
            </label>
            <Input
              id="rename-input"
              type="text"
              required
              error={isError}
              disabled={isPending}
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
              }}
            />
          </>
        )}
      </ActionModal>

      <Dialog open={propertiesModalOpen} onOpenChange={setPropertiesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{file.name}</DialogTitle>
            <DialogDescription>Properties of {file.name}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>Name:</div>
            <div className="col-span-3">{file.name}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>Location:</div>
            <div className="col-span-3">{parentPath}</div>
            {!file.isDirectory && (
              <>
                <div>Size:</div>
                <div className="col-span-3">{bytesToSize(file.size)}</div>
              </>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>Created:</div>
            <div className="col-span-3">
              {unixTimeToString(file.creationDate)}
            </div>
            <div>Modified:</div>
            <div className="col-span-3">
              {unixTimeToString(file.modificationDate)}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
