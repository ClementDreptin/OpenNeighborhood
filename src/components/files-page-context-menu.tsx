"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { createDirectoryAction } from "@/lib/actions";

const DIRNAME_INPUT_HELPER_TEXT_ID = "dirname-helper-text";
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
  const [formState, formAction, isPending] = React.useActionState(
    (_: unknown, formData: FormData) => createDirectoryAction(formData),
    null,
  );
  const isError = formState?.success === false && !isPending;

  const handleCreateDirectory = (formData: FormData) => {
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("parentPath", parentPath);

    formAction(formData);
  };

  const openCreateDirectoryModal = () => {
    setCreateDirectoryModalOpen(true);
  };

  React.useEffect(() => {
    if (formState?.success === true) {
      setCreateDirectoryModalOpen(false);
    }
  }, [formState]);

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

      <Dialog
        open={createDirectoryModalOpen}
        onOpenChange={setCreateDirectoryModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create directory</DialogTitle>
            <DialogDescription>
              Enter a name for the new directory.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-4" action={handleCreateDirectory}>
            <label htmlFor={DIRNAME_INPUT_ID} className="sr-only">
              New directory name
            </label>
            <Input
              id={DIRNAME_INPUT_ID}
              name={DIRNAME_INPUT_ID}
              type="text"
              required
              error={isError}
              aria-describedby={
                isError ? DIRNAME_INPUT_HELPER_TEXT_ID : undefined
              }
            />

            {isError ? (
              <p
                id={DIRNAME_INPUT_HELPER_TEXT_ID}
                role="alert"
                className="text-destructive"
              >
                {formState.error?.message}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
