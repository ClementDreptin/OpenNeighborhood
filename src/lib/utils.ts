import type * as React from "react";
import path from "node:path";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Taken from here:
// https://gist.github.com/lanqy/5193417?permalink_comment_id=4379535#gistcomment-4379535
export function bytesToSize(bytes: number) {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"];
  const unitIndex = Math.max(
    0,
    Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1),
  );

  return Intl.NumberFormat(undefined, {
    notation: "compact",
    style: "unit",
    unit: units[unitIndex],
    unitDisplay: "narrow",
  }).format(bytes / 1024 ** unitIndex);
}

export function unixTimeToString(time: number) {
  return new Date(time * 1000).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

export function isValidIpv4(ipAddress: string) {
  return /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(ipAddress);
}

export function displayToast(
  message: React.ReactNode,
  type: "success" | "error",
) {
  toast[type](message, {
    richColors: true,
    action: {
      label: "Dismiss",
      // I don't know why onClick is required since clicking the button
      // will close the toast even if onClick doesn't do anything, whatever...
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onClick: () => {},
    },
  });
}

export function getPathParts(path: string, delimiter: "/" | "\\" = "\\") {
  // When a directory is dropped, the files at its root will have a path that looks
  // like "./<filename>", so if we split on "/" we get [".", "<filename>"], which is
  // why we need to filter out the "."
  return path.split(delimiter).filter((part) => part !== "" && part !== ".");
}

export function pathDirname(path: string, delimiter: "/" | "\\" = "\\") {
  // Equivalent to `path.win32.dirname()`, or `path.dirname()` if delimiter is overridden,
  // to use in client components

  const parts = getPathParts(path, delimiter);

  // The last part is the file name so we remove it
  parts.pop();

  return parts.join(delimiter);
}

export function pathBasename(path: string, delimiter: "/" | "\\" = "\\") {
  // Equivalent to `path.win32.basename()`, or `path.basename()` if delimiter is overridden,
  // to use in client components
  return getPathParts(path, delimiter).pop();
}

export function pathJoin(...parts: string[]) {
  // Custom implementation of path.win32.join to support multiletter drive names
  // This became needed after node v22.13.1 which stopped supporting multiletter
  // drive names to fix a CVE (https://github.com/nodejs/node/commit/99f217369f)

  const [firstPart, ...remainingParts] = parts;
  const multiLetterDriveNameRegex = /^[a-zA-Z]{2,}:/;

  // If the first path is a multiletter drive name, extract the drive name
  // path the rest of the path using the built-in path.win32.join function,
  // and then prepend the drive name manually with a string concatenation
  if (parts.length > 0 && multiLetterDriveNameRegex.test(firstPart)) {
    const colonIndex = firstPart.indexOf(":");
    const drive = firstPart.slice(0, colonIndex);
    const restAfterDriveName = firstPart.slice(colonIndex + 1);

    // Always prepend the rest of the path with a separator so that we know
    // for sure it's always present after the drive name
    const restOfPath = path.win32.join(
      "\\",
      restAfterDriveName,
      ...remainingParts,
    );

    return `${drive}:${restOfPath}`;
  }

  return path.win32.join(...parts);
}
