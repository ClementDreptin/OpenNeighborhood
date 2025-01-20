"use client";

import type { StaticImageData } from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Description } from "@radix-ui/react-dialog";
import { IconButton } from "./ui/icon-button";
import driveIcon from "@/../public/drive.svg";
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
import { CircleProgress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Drive } from "@/lib/consoles";
import { bytesToSize } from "@/lib/utils";

interface DriveButtonProps {
  drive: Drive;
}

export default function DriveButton({ drive }: DriveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const driveNameWithoutColon = drive.name.slice(0, -1);
  const usedSpaceRatio =
    drive.totalBytes !== 0 ? drive.totalUsedBytes / drive.totalBytes : 0;

  const handleClick = () => {
    router.push(
      `${pathname}/files?${new URLSearchParams({ path: `${drive.name}\\` })}`,
    );
  };

  return (
    <Dialog>
      <ContextMenu>
        <ContextMenuTrigger>
          <IconButton
            title={drive.friendlyName}
            iconSrc={driveIcon as StaticImageData}
            onClick={handleClick}
          >
            {`${drive.friendlyName} (${drive.name})`}
          </IconButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <DialogTrigger asChild>
            <ContextMenuItem inset>Properties</ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driveNameWithoutColon}</DialogTitle>
          <Description>Properties of {driveNameWithoutColon}</Description>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          <div>Drive:</div>
          <div className="col-span-2">{driveNameWithoutColon}</div>
          <div>Type:</div>
          <div className="col-span-2">{drive.friendlyName}</div>
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-x-4 gap-y-2">
          <div>Used space:</div>
          <div className="col-span-2 text-right">
            {drive.totalUsedBytes.toLocaleString()} bytes
          </div>
          <div className="text-right">{bytesToSize(drive.totalUsedBytes)}</div>
          <div>Free space:</div>
          <div className="col-span-2 text-right">
            {drive.totalFreeBytes.toLocaleString()} bytes
          </div>
          <div className="text-right">{bytesToSize(drive.totalFreeBytes)}</div>
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-4">
          <div>Capacity:</div>
          <div className="col-span-2 text-right">
            {drive.totalBytes.toLocaleString()} bytes
          </div>
          <div className="text-right">{bytesToSize(drive.totalBytes)}</div>
        </div>

        <div className="flex justify-center">
          <CircleProgress value={usedSpaceRatio} />
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
