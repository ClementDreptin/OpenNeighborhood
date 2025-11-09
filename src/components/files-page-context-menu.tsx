"use client";

import * as React from "react";
import ActionModal from "@/components/action-modal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
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
  const { clipboardPath, setClipboardPath } = useFilesContext();
  const [createDirectoryModalOpen, setCreateDirectoryModalOpen] =
    React.useState(false);

  const handlePaste = () => {
    if (clipboardPath === "") {
      displayToast("There is nothing to paste.", "error");
      return;
    }

    const fileName = pathBasename(clipboardPath);
    if (fileName == null) {
      displayToast("Wrong path format.", "error");
      return;
    }

    const newPath =
      (!parentPath.endsWith("\\") ? `${parentPath}\\` : parentPath) + fileName;

    const formData = new FormData();
    formData.set("ipAddress", ipAddress);
    formData.set("oldName", clipboardPath);
    formData.set("newName", newPath);

    renameFile(formData);
    setClipboardPath("");
  };

  const handleCreateDirectory = (formData: FormData) => {
    formData.set("ipAddress", ipAddress);
    formData.set("parentPath", parentPath);

    return createDirectoryAction(formData);
  };

  const openCreateDirectoryModal = () => {
    setCreateDirectoryModalOpen(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="flex grow">
          {children}
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            inset
            disabled={clipboardPath === ""}
            onClick={handlePaste}
          >
            Paste
          </ContextMenuItem>
          <ContextMenuItem inset onClick={openCreateDirectoryModal}>
            Create directory
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
