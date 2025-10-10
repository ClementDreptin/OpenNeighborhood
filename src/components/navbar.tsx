"use client";

import * as React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useDirPath, useIpAddress } from "@/lib/hooks";

interface NavbarItem {
  label: string;
  href: string;
}

export default function Navbar() {
  const ipAddress = useIpAddress();
  const dirPath = useDirPath();
  const lastPartRef = React.useRef<HTMLLIElement | null>(null);

  const getParts = () => {
    // The home part is always there
    const parts: NavbarItem[] = [
      {
        label: "Home",
        href: "/",
      },
    ];

    // Followed by the IP address if on a /[ipAddress]/* route
    if (ipAddress !== "") {
      parts.push({
        label: ipAddress,
        href: `/${ipAddress}`,
      });
    }

    // And finally a part for each parent directory and the current
    // directory itself
    if (dirPath !== "") {
      const pathParts = dirPath
        .split("\\")
        .filter(Boolean)
        .map((dirName, index, array) => ({
          label: dirName,
          href: `/${ipAddress}/files?${new URLSearchParams({
            // Recreate the path from the root to this directory
            path: array.slice(0, index + 1).join("\\") + "\\",
          })}`,
        }));

      parts.push(...pathParts);
    }

    return parts;
  };

  React.useEffect(() => {
    lastPartRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dirPath]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="navbar-scrollbar flex-nowrap overflow-x-auto">
        {getParts().map((part, index, parts) =>
          // Add a link followed by a separator for each part except the last one
          index !== parts.length - 1 ? (
            <React.Fragment key={part.href}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link className="whitespace-nowrap" href={part.href}>
                    {part.label}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ) : (
            // Make the last part a regular text instead of a link
            <BreadcrumbItem key={part.href} ref={lastPartRef}>
              <BreadcrumbPage className="whitespace-nowrap">
                {part.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
