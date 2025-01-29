"use server";

import { revalidatePath } from "next/cache";
import {
  createConsole,
  createDirectory,
  deleteConsole,
  deleteFile,
  goToDashboard,
  launchXex,
  reboot,
  renameFile,
  restartActiveTitle,
  shutdown,
  syncTime,
} from "./consoles";
import "server-only";

export type FormAction = (
  formData: FormData,
) => Promise<{ success: boolean; error?: Error }>;

export const createConsoleAction = genericAction(
  createConsole,
  ["ipAddress"],
  "/",
);

export const deleteConsoleAction = genericAction(
  deleteConsole,
  ["ipAddress"],
  "/",
);

export const deleteFileAction = genericAction(
  deleteFile,
  ["ipAddress", "filePath", "isDirectory"],
  "/[ipAddress]/files",
);

export const renameFileAction = genericAction(
  renameFile,
  ["ipAddress", "oldName", "newName"],
  "/[ipAddress]/files",
);

export const launchXexAction = genericAction(launchXex, [
  "ipAddress",
  "filePath",
]);

export const createDirectoryAction = genericAction(
  createDirectory,
  ["ipAddress", "dirName", "parentPath"],
  "/[ipAddress]/files",
);

export const goToDashboardAction = genericAction(goToDashboard, ["ipAddress"]);

export const restartActiveTitleAction = genericAction(restartActiveTitle, [
  "ipAddress",
]);

export const rebootAction = genericAction(reboot, ["ipAddress"]);

export const shutdownAction = genericAction(shutdown, ["ipAddress"]);

export const syncTimeAction = genericAction(syncTime, ["ipAddress"]);

function genericAction(
  func: (...args: string[]) => Promise<void>,
  keys: string[],
  pathToRevalidate?: string,
): FormAction {
  return async (formData: FormData) => {
    const params = [];
    for (const key of keys) {
      const value = formData.get(key);
      if (typeof value !== "string" || value === "") {
        return {
          success: false,
          error: new Error(`${key} needs to be a non-empty string.`),
        };
      }

      params.push(value);
    }

    try {
      await func(...params);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Something went wrong."),
      };
    }

    if (pathToRevalidate != null) {
      const isDynamicPath =
        pathToRevalidate.includes("[") && pathToRevalidate.includes("]");
      revalidatePath(pathToRevalidate, isDynamicPath ? "page" : undefined);
    }

    return { success: true };
  };
}
