"use server";

import { revalidatePath } from "next/cache";
import {
  createConsole,
  deleteConsole,
  deleteFile,
  launchXex,
} from "./consoles";
import "server-only";

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

export async function deleteConsoleAction(_: unknown, formData: FormData) {
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

export async function deleteFileAction(formData: FormData) {
  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    throw new Error("ipAddress needs to be of type string.");
  }

  const filePath = formData.get("filePath");
  if (typeof filePath !== "string") {
    throw new Error("filePath needs to be of type string.");
  }

  await deleteFile(ipAddress, filePath);

  revalidatePath(`/${ipAddress}/files`);
}
