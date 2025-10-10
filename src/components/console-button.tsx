"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import consoleIcon from "@/../public/console.svg";
import ActionModal from "@/components/action-modal";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import {
  deleteConsoleAction,
  goToDashboardAction,
  rebootAction,
  restartActiveTitleAction,
  shutdownAction,
  syncTimeAction,
} from "@/lib/actions";
import type { Console } from "@/lib/consoles";
import { useActionToast } from "@/lib/hooks";

interface ConsoleButtonProps {
  console: Console;
}

export default function ConsoleButton({ console }: ConsoleButtonProps) {
  const router = useRouter();
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] =
    React.useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = React.useState(false);
  const goToDashboard = useActionToast(goToDashboardAction);
  const restartActiveTitle = useActionToast(restartActiveTitleAction);
  const reboot = useActionToast(rebootAction);
  const shutdown = useActionToast(shutdownAction);
  const syncTime = useActionToast(syncTimeAction);

  const handleClick = () => {
    router.push(`/${console.ipAddress}`);
  };

  const handleGoToDashboard = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    goToDashboard(formData);
  };

  const handleRestartActiveTitle = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    restartActiveTitle(formData);
  };

  const handleReboot = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    reboot(formData);
  };

  const handleShutdown = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    shutdown(formData);
  };

  const handleSyncTime = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    syncTime(formData);
  };

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    return deleteConsoleAction(formData);
  };

  const openConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(true);
  };

  const openPropertiesModal = () => {
    setPropertiesModalOpen(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <IconButton
            className="break-all"
            title={console.name}
            iconSrc={consoleIcon as StaticImageData}
            onClick={handleClick}
          >
            {console.name}
          </IconButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger inset>Reboot</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem inset onClick={handleGoToDashboard}>
                Title
              </ContextMenuItem>
              <ContextMenuItem inset onClick={handleRestartActiveTitle}>
                Title to active title
              </ContextMenuItem>
              <ContextMenuItem inset onClick={handleReboot}>
                Cold
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem inset onClick={handleShutdown}>
            Shutdown
          </ContextMenuItem>
          <ContextMenuItem inset onClick={handleSyncTime}>
            Synchronize Time
          </ContextMenuItem>

          <Separator />

          <ContextMenuItem inset onClick={openConfirmDeleteModal}>
            Delete
          </ContextMenuItem>

          <Separator />

          <ContextMenuItem inset onClick={openPropertiesModal}>
            Properties
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ActionModal
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
        action={handleDelete}
        description={`Are you sure you want to delete ${console.ipAddress}?`}
      />

      <Dialog open={propertiesModalOpen} onOpenChange={setPropertiesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{console.name}</DialogTitle>
            <DialogDescription>Properties of {console.name}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>Name:</div>
            <div className="col-span-3">{console.name}</div>
            <div>Type:</div>
            <div className="col-span-3">{console.type}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>IP address:</div>
            <div className="col-span-3">{console.ipAddress}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>Active title:</div>
            <div className="col-span-3 break-words">{console.activeTitle}</div>
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
