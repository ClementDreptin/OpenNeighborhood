"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import addConsoleButtonIcon from "@/../public/add-console-button.svg";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { createConsoleAction } from "@/lib/actions";

const IP_ADDRESS_HELPER_TEXT_ID = "ip-address-helper-text";

export default function AddConsoleButton() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [ipAddressBytes, setIpAddressBytes] = React.useState([192, 168, 1, 10]);
  const [formState, formAction, isPending] = React.useActionState(
    createConsoleAction,
    null,
  );
  const isError = formState?.success === false;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = event.target.valueAsNumber;
    if (Number.isNaN(value)) {
      return;
    }

    const newBytes = [...ipAddressBytes];
    newBytes[index] = value;
    setIpAddressBytes(newBytes);
  };

  React.useEffect(() => {
    if (formState?.success === true) {
      setModalOpen(false);
    }
  }, [formState]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <IconButton iconSrc={addConsoleButtonIcon as StaticImageData}>
          Add Xbox 360
        </IconButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Xbox 360</DialogTitle>
          <DialogDescription>
            Enter the IP address of the Xbox 360 you want to add.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" action={formAction}>
          <div className="flex gap-2">
            {ipAddressBytes.map((byte, index) => {
              const id = `ip-address-byte-${index.toString()}`;

              return (
                <div key={index} className="w-full">
                  <label htmlFor={id} className="sr-only">
                    Byte {index + 1}
                  </label>
                  <Input
                    id={id}
                    name={id}
                    required
                    error={isError}
                    aria-describedby={
                      isError ? IP_ADDRESS_HELPER_TEXT_ID : undefined
                    }
                    type="number"
                    min={0}
                    max={255}
                    value={byte}
                    onChange={(event) => {
                      handleChange(event, index);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {isError ? (
            <p
              id={IP_ADDRESS_HELPER_TEXT_ID}
              role="alert"
              className="text-destructive"
            >
              {formState.error?.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
