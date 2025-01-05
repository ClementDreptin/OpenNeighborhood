"use client";

import * as React from "react";
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

export default function AddConsoleButton() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [ipAddressBytes, setIpAddressBytes] = React.useState([192, 168, 1, 10]);

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

  const handleAdd: React.MouseEventHandler = (event) => {
    event.preventDefault();

    console.log("console added");
    setModalOpen(false);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <IconButton iconSrc={addConsoleButtonIcon}>Add Xbox 360</IconButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Xbox 360</DialogTitle>
          <DialogDescription>
            Enter the IP address of the Xbox 360 you want to add.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4">
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
                    required
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

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleAdd}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
