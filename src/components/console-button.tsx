"use client";

import * as React from "react";
import consoleIcon from "@/../public/console.svg";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { deleteConsoleAction } from "@/lib/actions";
import type { Console } from "@/lib/consoles";

interface ConsoleButtonProps {
  console: Console;
}

export default function ConsoleButton({ console }: ConsoleButtonProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [formState, formAction, isPending] = React.useActionState(
    deleteConsoleAction,
    null,
  );
  const isError = formState?.success === false;

  const formActionWrapper = () => {
    const formData = new FormData();
    formData.set("ipAddress", console.ipAddress);
    formAction(formData);
  };

  React.useEffect(() => {
    if (formState?.success === true) {
      setModalOpen(false);
    }
  }, [formState]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <ContextMenu>
        <ContextMenuTrigger>
          <IconButton
            className="break-all"
            title={console.name}
            iconSrc={consoleIcon}
          >
            {console.name}
          </IconButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <DialogTrigger asChild>
            <ContextMenuItem inset>Delete</ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {console.ipAddress}?
          </DialogDescription>
        </DialogHeader>

        <form action={formActionWrapper}>
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
  );
}
