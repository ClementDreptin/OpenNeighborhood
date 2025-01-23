"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import ActionModal from "@/components/action-modal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { createDirectoryAction } from "@/lib/actions";

const DIRNAME_INPUT_ID = "dirname";

interface FilesPageContextMenuProps {
  children: React.ReactNode;
}

export default function FilesPageContextMenu({
  children,
}: FilesPageContextMenuProps) {
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const parentPath = searchParams.get("path") ?? "";
  const [createDirectoryModalOpen, setCreateDirectoryModalOpen] =
    React.useState(false);

  const handleCreateDirectory = (formData: FormData) => {
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("parentPath", parentPath);

    return createDirectoryAction(formData);
  };

  const openCreateDirectoryModal = () => {
    setCreateDirectoryModalOpen(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>

        <ContextMenuContent>
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
            <label htmlFor={DIRNAME_INPUT_ID} className="sr-only">
              New directory name
            </label>
            <Input
              id={DIRNAME_INPUT_ID}
              name={DIRNAME_INPUT_ID}
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
