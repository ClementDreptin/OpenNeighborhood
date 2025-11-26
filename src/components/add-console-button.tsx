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
        action={createConsoleAction}
        title="Add Xbox 360"
        description="Enter the name or the IP address of the Xbox 360 you want to add."
        actions={{
          cancel: "Cancel",
          submit: "Confirm",
        }}
      >
        {({ isError, isPending }) => (
          <>
            <label htmlFor="name-or-ip-address-input" className="sr-only">
              Console name or IP address
            </label>
            <Input
              id="name-or-ip-address-input"
              name="nameOrIpAddress"
              type="text"
              required
              error={isError}
              disabled={isPending}
            />
          </>
        )}
      </ActionModal>
    </>
  );
}
