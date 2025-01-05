"use server";

import { revalidatePath } from "next/cache";
import { createConsole, deleteConsole } from "./consoles";
import "server-only";

export async function createConsoleAction(_: unknown, formData: FormData) {
  const ipAddressBytes = Array.from(formData.values());

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
  const ipAddress = formData.get("ipAddress") ?? "";

  try {
    await deleteConsole(ipAddress.toString());
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  revalidatePath("/");

  return { success: true };
}
