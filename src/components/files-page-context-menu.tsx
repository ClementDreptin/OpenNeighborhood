"use client";

import * as React from "react";
import ActionModal from "@/components/action-modal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useFilesContext } from "@/contexts/files-context";
import { createDirectoryAction, renameFileAction } from "@/lib/actions";
import { useActionToast, useDirPath, useIpAddress } from "@/lib/hooks";
import { displayToast, pathBasename } from "@/lib/utils";

interface FilesPageContextMenuProps {
  children: React.ReactNode;
}

export default function FilesPageContextMenu({
  children,
}: FilesPageContextMenuProps) {
  const ipAddress = useIpAddress();
  const parentPath = useDirPath();
  const renameFile = useActionToast(renameFileAction);
  const { clipboardPaths, setClipboardPaths } = useFilesContext();
  const [createDirectoryModalOpen, setCreateDirectoryModalOpen] =
    React.useState(false);

  const handlePaste = () => {
    if (clipboardPaths.length === 0) {
      displayToast("There is nothing to paste.", "error");
      return;
    }

    for (const clipboardPath of clipboardPaths) {
      const fileName = pathBasename(clipboardPath);
      if (fileName == null) {
        displayToast("Wrong path format.", "error");
        return;
      }

      const newPath = `${parentPath}\\${fileName}`;

      const formData = new FormData();
      formData.set("ipAddress", ipAddress);
      formData.set("oldName", clipboardPath);
      formData.set("newName", newPath);

      renameFile(formData);
    }

    setClipboardPaths([]);
  };

  const handleCreateDirectory = (formData: FormData) => {
    formData.set("ipAddress", ipAddress);
    formData.set("parentPath", parentPath);

    return createDirectoryAction(formData);
  };

  const openCreateDirectoryModal = () => {
    setCreateDirectoryModalOpen(true);
  };

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    if (event.ctrlKey) {
      if (event.altKey) {
        if (event.key === "n") {
          openCreateDirectoryModal();
        }
      } else {
        if (event.key === "v") {
          handlePaste();
        }
      }
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="flex grow" onKeyDown={handleKeyDown}>
          {children}
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            inset
            disabled={clipboardPaths.length === 0}
            onClick={handlePaste}
          >
            Paste
          </ContextMenuItem>
          <ContextMenuItem inset onClick={openCreateDirectoryModal}>
            Create directory
            <ContextMenuShortcut>Ctrl+Alt+N</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ActionModal
        open={createDirectoryModalOpen}
        onOpenChange={setCreateDirectoryModalOpen}
        action={handleCreateDirectory}
        title="Create directory"
        description="Enter a name for the new directory."
      >
        {({ isError, isPending }) => (
          <>
            <label htmlFor="create-dir-input" className="sr-only">
              New directory name
            </label>
            <Input
              id="create-dir-input"
              name="dirName"
              type="text"
              required
              error={isError}
              disabled={isPending}
            />
          </>
        )}
      </ActionModal>
    </>
  );
}
