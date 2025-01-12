"use server";

import { launchXex } from "./consoles";
import "server-only";

export async function launchXexAction(_: unknown, formData: FormData) {
  const ipAddress = formData.get("ipAddress") ?? "";
  const filePath = formData.get("filePath") ?? "";

  try {
    await launchXex(ipAddress.toString(), filePath.toString());
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Something went wrong."),
    };
  }

  return { success: true };
}
