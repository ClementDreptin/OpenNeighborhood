"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import consoleIcon from "@/../public/console.svg";
import ActionModal from "@/components/action-modal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import {
  deleteConsoleAction,
  goToDashboardAction,
  rebootAction,
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
  const [modalOpen, setModalOpen] = React.useState(false);
  const goToDashboard = useActionToast(goToDashboardAction);
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

  const openModal = () => {
    setModalOpen(true);
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
              <ContextMenuItem inset>Title to active title</ContextMenuItem>
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

          <ContextMenuItem inset onClick={openModal}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        action={handleDelete}
        description={`Are you sure you want to delete ${console.ipAddress}?`}
      />
    </>
  );
}
