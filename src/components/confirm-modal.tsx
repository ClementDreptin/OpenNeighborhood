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
import type { FormAction } from "@/lib/actions";

interface ConfirmModalProps {
  open: React.ComponentProps<typeof Dialog>["open"];
  onOpenChange: React.ComponentProps<typeof Dialog>["onOpenChange"];
  action: FormAction;
  title?: React.ReactNode;
  description: React.ReactNode;
  children?:
    | React.ReactNode
    | ((props: { isError: boolean; isPending: boolean }) => React.ReactNode);
  actions?: {
    cancel?: React.ReactNode;
    submit?: React.ReactNode;
  };
}

export default function ConfirmModal(props: ConfirmModalProps) {
  const {
    open,
    onOpenChange,
    action,
    title = "Confirmation",
    description,
    children,
    actions = { cancel: "No", submit: "Yes", ...props.actions },
  } = props;

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" action={formAction}>
          {typeof children === "function"
            ? children({ isError, isPending })
            : children}

          {isError ? (
            <p role="alert" className="text-destructive">
              {formState.error?.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{actions.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {actions.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
