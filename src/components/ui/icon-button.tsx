import * as React from "react";
import Image from "next/image";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonProps {
  iconSrc: React.ComponentProps<typeof Image>["src"];
  priority?: React.ComponentProps<typeof Image>["priority"];
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, iconSrc, priority = true, children, ...props }, ref) => (
    <Button
      variant="outline"
      className={cn("h-full w-full justify-around gap-4 text-wrap", className)}
      ref={ref}
      {...props}
    >
      <Image alt="" priority={priority} src={iconSrc} />
      <div className="flex-grow self-start">
        <div
          style={{ overflowWrap: "anywhere" }}
          className="line-clamp-3 text-start"
        >
          {children}
        </div>
      </div>
    </Button>
  ),
);
IconButton.displayName = "IconButton";

export { IconButton };
