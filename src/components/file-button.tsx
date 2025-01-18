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
import { toast } from "sonner";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { launchXexAction } from "@/lib/actions";
import type { File } from "@/lib/consoles";
import { bytesToSize, unixTimeToString } from "@/lib/utils";

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

  const icon = file.isDirectory
    ? (directoryIcon as StaticImageData)
    : file.isXex
      ? (xexIcon as StaticImageData)
      : (fileIcon as StaticImageData);

  const openDirectory = () => {
    router.push(`${pathname}?${new URLSearchParams({ path: fullPath })}`);
  };

  const handleLaunch = () => {
    const formData = new FormData();
    formData.set("ipAddress", typeof ipAddress === "string" ? ipAddress : "");
    formData.set("filePath", fullPath);

    launchXexAction(null, formData).catch((error: unknown) => {
      if (error instanceof Error) {
        displayErrorToast(error);
      }
    });
  };

  const handleDownload = () => {
    if (file.isDirectory) {
      displayErrorToast(new Error("Not implemented"));
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

  const handleClick = () => {
    if (file.isDirectory) {
      openDirectory();
    }
  };

  return (
    <Dialog>
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
          <DialogTrigger asChild>
            <ContextMenuItem inset>Properties</ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
          <DialogDescription>Properties of {file.name}</DialogDescription>
        </DialogHeader>

        <div className="grid-cols-4 grid gap-x-4 gap-y-2">
          <div>Name:</div>
          <div className="col-span-3">{file.name}</div>
        </div>

        <Separator />

        <div className="grid-cols-4 grid gap-x-4 gap-y-2">
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

        <div className="grid-cols-4 grid gap-x-4 gap-y-2">
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
  );
}

function displayErrorToast(error: Error) {
  toast.error(error.message, {
    richColors: true,
    action: {
      label: "Dismiss",
      // I don't know why onClick is required since clicking the button
      // will close the toast even if onClick doesn't do anything, whatever...
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onClick: () => {},
    },
  });
}
