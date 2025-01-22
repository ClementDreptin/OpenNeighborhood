"use server";

import { revalidatePath } from "next/cache";
import {
  createConsole,
  createDirectory,
  deleteConsole,
  deleteFile,
  launchXex,
} from "./consoles";
import "server-only";

export type FormAction = (
  formData: FormData,
) => Promise<{ success: boolean; error?: Error }>;

export async function createConsoleAction(_: unknown, formData: FormData) {
  const ipAddressBytes = Array.from(formData.values()).map(String);

  try {
    await createConsole(ipAddressBytes.join("."));
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath("/");

  return { success: true };
}

export const deleteConsoleAction: FormAction = async (formData) => {
  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    return {
      success: false,
      error: new Error("ipAddress needs to be of type string."),
    };
  }

  try {
    await deleteConsole(ipAddress);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath("/");

  return { success: true };
};

export const deleteFileAction: FormAction = async (formData) => {
  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    return {
      success: false,
      error: new Error("ipAddress needs to be of type string."),
    };
  }

  const filePath = formData.get("filePath");
  if (typeof filePath !== "string") {
    return {
      success: false,
      error: new Error("filePath needs to be of type string."),
    };
  }

  const isDirectory = formData.get("isDirectory") === "true";

  try {
    await deleteFile(ipAddress, filePath, isDirectory);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath(`/${ipAddress}/files`);

  return { success: true };
};

export async function launchXexAction(formData: FormData) {
  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    throw new Error("ipAddress needs to be of type string.");
  }

  const filePath = formData.get("filePath");
  if (typeof filePath !== "string") {
    throw new Error("filePath needs to be of type string.");
  }

  await launchXex(ipAddress, filePath);
}

export const createDirectoryAction: FormAction = async (formData) => {
  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    return {
      success: false,
      error: new Error("ipAddress needs to be of type string."),
    };
  }

  const parentPath = formData.get("parentPath");
  if (typeof parentPath !== "string") {
    return {
      success: false,
      error: new Error("parentPath needs to be of type string."),
    };
  }

  const dirName = formData.get("dirName");
  if (typeof dirName !== "string") {
    return {
      success: false,
      error: new Error("dirName needs to be of type string."),
    };
  }

  try {
    await createDirectory(ipAddress, dirName, parentPath);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath(`/${ipAddress}/files`);

  return { success: true };
};
