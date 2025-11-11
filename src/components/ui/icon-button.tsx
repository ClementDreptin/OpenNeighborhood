import * as React from "react";
import Image from "next/image";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonProps {
  iconSrc: React.ComponentProps<typeof Image>["src"];
  priority?: React.ComponentProps<typeof Image>["priority"];
  selected?: boolean;
}

function IconButton({
  className,
  iconSrc,
  priority,
  selected = false,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-full w-full justify-around gap-4 whitespace-normal",
        selected ? "ring-ring/50 ring-[3px]" : undefined,
        className,
      )}
      {...props}
    >
      <Image alt="" priority={priority} src={iconSrc} />
      <div className="grow self-start">
        <div
          style={{ overflowWrap: "anywhere" }}
          className="line-clamp-3 text-start"
        >
          {children}
        </div>
      </div>
    </Button>
  );
}

export { IconButton };
