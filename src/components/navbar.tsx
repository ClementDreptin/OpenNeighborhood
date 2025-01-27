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

  const getParts = () => {
    const parts: NavbarItem[] = [
      {
        label: "Home",
        href: "/",
      },
    ];

    if (ipAddress !== "") {
      parts.push({
        label: ipAddress,
        href: `/${ipAddress}`,
      });
    }

    if (dirPath !== "") {
      const pathParts = dirPath
        .split("\\")
        .filter(Boolean)
        .map((dirName, index, array) => ({
          label: dirName,
          href: `/${ipAddress}/files?${new URLSearchParams({
            path: array.slice(0, index + 1).join("\\"),
          })}`,
        }));

      parts.push(...pathParts);
    }

    return parts;
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-md">
        {getParts().map((part, index, parts) =>
          index !== parts.length - 1 ? (
            <React.Fragment key={part.href}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={part.href}>{part.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ) : (
            <BreadcrumbItem key={part.href}>
              <BreadcrumbPage>{part.label}</BreadcrumbPage>
            </BreadcrumbItem>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
