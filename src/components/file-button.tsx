"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { DialogDescription } from "@radix-ui/react-dialog";
import { IconButton } from "./ui/icon-button";
import directoryIcon from "@/../public/directory.svg";
import fileIcon from "@/../public/file.svg";
import xexIcon from "@/../public/xex.svg";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { deleteFileAction, launchXexAction } from "@/lib/actions";
import type { File } from "@/lib/consoles";
import { bytesToSize, displayErrorToast, unixTimeToString } from "@/lib/utils";

interface FileButtonProps {
  file: File;
}

export default function FileButton({ file }: FileButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ipAddress } = useParams();
  const searchParams = useSearchParams();
  const parentPath = searchParams.get("path") ?? "";
  const fullPath =
    (!parentPath.endsWith("\\") ? `${parentPath}\\` : parentPath) + file.name;
  const [propertiesModalOpen, setPropertiesModalOpen] = React.useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] =
    React.useState(false);
  const [formState, formAction, isPending] = React.useActionState(
    deleteFileAction,
    null,
  );
  const isError = formState?.success === false && !isPending;

  const icon = file.isDirectory
    ? (directoryIcon as StaticImageData)
    : file.isXex
      ? (xexIcon as StaticImageData)
      : (fileIcon as StaticImageData);

  const handleClick = () => {
    if (file.isDirectory) {
      router.push(`${pathname}?${new URLSearchParams({ path: fullPath })}`);
    }
  };

  const handleLaunch = () => {
    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("filePath", fullPath);

    launchXexAction(formData).catch((error: unknown) => {
      if (error instanceof Error) {
        displayErrorToast(error.message);
      }
    });
  };

  const handleDownload = () => {
    if (file.isDirectory) {
      displayErrorToast("Not implemented.");
      return;
    }

    const url = new URL(
      `${window.location.pathname}/download`,
      window.location.origin,
    );
    url.searchParams.set(
      "ipAddress",
      typeof ipAddress === "string" ? ipAddress : "",
    );
    url.searchParams.set("path", fullPath);

    const link = document.createElement("a");
    link.href = url.toString();
    link.click();
  };

  const handleDelete = () => {
    if (file.isDirectory) {
      displayErrorToast("Not implemented.");
      return;
    }

    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("filePath", fullPath);

    formAction(formData);
  };

  const openPropertiesModal = () => {
    setPropertiesModalOpen(true);
  };

  const openConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(true);
  };

  React.useEffect(() => {
    if (formState?.success === true) {
      setConfirmDeleteModalOpen(false);
    }
  }, [formState]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <IconButton title={file.name} iconSrc={icon} onClick={handleClick}>
            {file.name}
          </IconButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {file.isXex && (
            <ContextMenuItem className="font-bold" inset onClick={handleLaunch}>
              Launch
            </ContextMenuItem>
          )}
          <ContextMenuItem inset onClick={handleDownload}>
            Download
          </ContextMenuItem>
          <ContextMenuItem inset onClick={openConfirmDeleteModal}>
            Delete
          </ContextMenuItem>
          <Separator />
          <ContextMenuItem inset onClick={openPropertiesModal}>
            Properties
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{file.name}</strong>
              {file.isDirectory ? " and all of its contents" : ""}?
            </DialogDescription>
          </DialogHeader>

          <form action={handleDelete}>
            {isError ? (
              <p role="alert" className="text-destructive">
                {formState.error?.message}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">No</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                Yes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={propertiesModalOpen} onOpenChange={setPropertiesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{file.name}</DialogTitle>
            <DialogDescription>Properties of {file.name}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            <div>Name:</div>
            <div className="col-span-3">{file.name}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
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

          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
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
