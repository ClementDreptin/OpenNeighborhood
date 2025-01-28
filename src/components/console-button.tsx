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
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import {
  deleteConsoleAction,
  shutdownAction,
  syncTimeAction,
} from "@/lib/actions";
import type { Console } from "@/lib/consoles";
import { displayErrorToast } from "@/lib/utils";

interface ConsoleButtonProps {
  console: Console;
}

export default function ConsoleButton({ console }: ConsoleButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleClick = () => {
    router.push(`/${console.ipAddress}`);
  };

  const handleShutdown = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    shutdownAction(formData)
      .then((result) => {
        if (result.error != null) {
          displayErrorToast(result.error.message);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          displayErrorToast(error.message);
        }
      });
  };

  const handleSyncTime = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);

    syncTimeAction(formData)
      .then((result) => {
        if (result.error != null) {
          displayErrorToast(result.error.message);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          displayErrorToast(error.message);
        }
      });
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
