"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import connectButtonIcon from "@/../public/connect-button.svg";
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
import { isValidIpv4 } from "@/lib/utils";

const DEFAULT_IP_ADDRESS_BYTES = [192, 168, 1, 10];
const IP_ADDRESS_LOCALSTORAGE_KEY = "ipAddress";

export default function ConnectButton() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ipAddressBytes, setIpAddressBytes] = React.useState(
    getIpAddressBytesFromLocalStorage(),
  );

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

  const handleSubmit: React.FormEventHandler = (event) => {
    event.preventDefault();

    const ipAddress = ipAddressBytes.join(".");

    localStorage.setItem(IP_ADDRESS_LOCALSTORAGE_KEY, ipAddress);

    setLoading(true);
    router.push(`/${ipAddress}`);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <IconButton iconSrc={connectButtonIcon}>Connect</IconButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Xbox 360</DialogTitle>
          <DialogDescription>
            Enter the IP address of the Xbox 360 you want to connect to.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            {ipAddressBytes.map((byte, index) => {
              const id = `ip-address-byte-${index}`;

              return (
                <div key={index} className="w-full">
                  <label htmlFor={id} className="sr-only">
                    Byte {index + 1}
                  </label>
                  <Input
                    id={id}
                    name={id}
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
            <Button type="submit" disabled={loading}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getIpAddressBytesFromLocalStorage() {
  if (typeof window === "undefined") {
    return DEFAULT_IP_ADDRESS_BYTES;
  }

  const ipAddress = localStorage.getItem(IP_ADDRESS_LOCALSTORAGE_KEY);
  if (ipAddress == null || !isValidIpv4(ipAddress)) {
    return DEFAULT_IP_ADDRESS_BYTES;
  }

  return ipAddress.split(".").map(Number);
}
