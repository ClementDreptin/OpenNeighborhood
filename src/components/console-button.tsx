"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import ConfirmModal from "./confirm-modal";
import consoleIcon from "@/../public/console.svg";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconButton } from "@/components/ui/icon-button";
import { deleteConsoleAction } from "@/lib/actions";
import type { Console } from "@/lib/consoles";

interface ConsoleButtonProps {
  console: Console;
}

export default function ConsoleButton({ console }: ConsoleButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleClick = () => {
    router.push(`/${console.ipAddress}`);
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
          <ContextMenuItem inset onClick={openModal}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ConfirmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        action={handleDelete}
      >
        Are you sure you want to delete {console.ipAddress}?
      </ConfirmModal>
    </>
  );
}
