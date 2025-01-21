import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions";

interface ConfirmModalProps {
  open: React.ComponentProps<typeof Dialog>["open"];
  onOpenChange: React.ComponentProps<typeof Dialog>["onOpenChange"];
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
}

export default function ConfirmModal(props: ConfirmModalProps) {
  const { open, onOpenChange, action, children } = props;
  const [formState, formAction, isPending] = React.useActionState(
    (_: unknown, formData: FormData) => action(formData),
    null,
  );
  const isError = formState?.success === false && !isPending;

  React.useEffect(() => {
    if (formState?.success === true) {
      onOpenChange?.(false);
    }
  }, [formState, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>{children}</DialogDescription>
        </DialogHeader>

        <form action={formAction}>
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
