"use client";

import * as React from "react";
import type { StaticImageData } from "next/image";
import addConsoleButtonIcon from "@/../public/add-console-button.svg";
import ActionModal from "@/components/action-modal";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { createConsoleAction } from "@/lib/actions";

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

  const openModal = () => {
    setModalOpen(true);
  };

  return (
    <>
      <IconButton
        iconSrc={addConsoleButtonIcon as StaticImageData}
        onClick={openModal}
      >
        Add Xbox 360
      </IconButton>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        action={createConsoleAction}
        title="Add Xbox 360"
        description="Enter the IP address of the Xbox 360 you want to add."
        actions={{
          cancel: "Cancel",
          submit: "Confirm",
        }}
      >
        {({ isError, isPending }) => (
          <div className="flex gap-2">
            {ipAddressBytes.map((byte, index) => {
              const id = `ip-address-byte-${index.toString()}`;

              return (
                <div key={index} className="flex-grow">
                  <label htmlFor={id} className="sr-only">
                    Byte {index + 1}
                  </label>
                  <Input
                    id={id}
                    name={id}
                    type="number"
                    min={0}
                    max={255}
                    required
                    error={isError}
                    disabled={isPending}
                    value={byte}
                    onChange={(event) => {
                      handleChange(event, index);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </ActionModal>
    </>
  );
}
