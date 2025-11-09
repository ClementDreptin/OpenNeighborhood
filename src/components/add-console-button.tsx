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

  const handleCreate = () => {
    const formData = new FormData();
    formData.set("ipAddress", ipAddressBytes.join("."));

    return createConsoleAction(formData);
  };

  const openModal = () => {
    setModalOpen(true);
  };

  return (
    <>
      <IconButton
        iconSrc={addConsoleButtonIcon as StaticImageData}
        onDoubleClick={openModal}
      >
        Add Xbox 360
      </IconButton>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        action={handleCreate}
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
              const id = `ip-address-byte-${index}`;

              return (
                <div key={index} className="grow">
                  <label htmlFor={id} className="sr-only">
                    Byte {index + 1}
                  </label>
                  <Input
                    id={id}
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
