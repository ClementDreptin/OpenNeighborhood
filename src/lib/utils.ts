import { clsx, type ClassValue } from "clsx";
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
