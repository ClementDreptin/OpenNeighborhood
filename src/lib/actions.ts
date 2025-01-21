"use server";

import { revalidatePath } from "next/cache";
import {
  createConsole,
  deleteConsole,
  deleteFile,
  launchXex,
} from "./consoles";
import "server-only";

export interface ActionResult {
  success: boolean;
  error?: Error;
}

export async function createConsoleAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
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

export async function deleteConsoleAction(
  formData: FormData,
): Promise<ActionResult> {
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
}

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

export async function deleteFileAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
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
}
