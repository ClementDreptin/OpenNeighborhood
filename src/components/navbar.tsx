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

export default function Navbar() {
  const ipAddress = useIpAddress();
  const dirPath = useDirPath();
  const parts = dirPath.split("\\").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-md">
        <BreadcrumbItem>
          {ipAddress !== "" ? (
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Home</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {ipAddress !== "" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {parts.length > 0 ? (
                <BreadcrumbLink asChild>
                  <Link href={`/${ipAddress}`}>{ipAddress}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{ipAddress}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {parts.length > 0 && <BreadcrumbSeparator />}
        {parts.map((part, index) =>
          index !== parts.length - 1 ? (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/${ipAddress}/files?${new URLSearchParams({ path: parts.slice(0, index + 1).join("\\") })}`}
                  >
                    {part}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ) : (
            <BreadcrumbItem key={index}>
              <BreadcrumbPage>{part}</BreadcrumbPage>
            </BreadcrumbItem>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
