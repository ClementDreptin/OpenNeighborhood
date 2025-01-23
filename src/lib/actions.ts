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

export const createConsoleAction: FormAction = async (formData: FormData) => {
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
};

export const deleteConsoleAction: FormAction = async (formData) => {
  const { ipAddress, error } = checkFormData(formData, ["ipAddress"]);
  if (error != null) {
    return {
      success: false,
      error,
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
  const { ipAddress, filePath, error } = checkFormData(formData, [
    "ipAddress",
    "filePath",
  ]);
  if (error != null) {
    return {
      success: false,
      error,
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

export const launchXexAction: FormAction = async (formData: FormData) => {
  const { ipAddress, filePath, error } = checkFormData(formData, [
    "ipAddress",
    "filePath",
  ]);
  if (error != null) {
    return {
      success: false,
      error,
    };
  }

  try {
    await launchXex(ipAddress, filePath);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  return { success: true };
};

export const createDirectoryAction: FormAction = async (formData) => {
  const { ipAddress, parentPath, dirname, error } = checkFormData(formData, [
    "ipAddress",
    "parentPath",
    "dirname",
  ]);
  if (error != null) {
    return {
      success: false,
      error,
    };
  }

  try {
    await createDirectory(ipAddress, dirname, parentPath);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath(`/${ipAddress}/files`);

  return { success: true };
};

function checkFormData<T extends string>(formData: FormData, keys: T[]) {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value !== "string" || value === "") {
      result.error = new Error(`${key} needs to be a non-empty string.`);
      break;
    }

    result[key] = value;
  }

  return result as Record<T, string> & { error?: Error };
}
