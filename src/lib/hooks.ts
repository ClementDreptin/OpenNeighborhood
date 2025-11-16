import type * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { FormAction } from "./actions";
import { displayToast } from "./utils";

export function useIpAddress() {
  const { ipAddress } = useParams();

  return typeof ipAddress === "string" ? ipAddress : "";
}

export function useDirPath() {
  const searchParams = useSearchParams();
  const path = searchParams.get("path") ?? "";

  // Remove potential trailing separator
  return path.endsWith("\\") ? path.slice(0, -1) : path;
}

export function useActionToast(action: FormAction) {
  return (formData: FormData, successMessage?: React.ReactNode) => {
    action(formData)
      .then((result) => {
        if (result.errorMessage != null) {
          displayToast(result.errorMessage, "error");
          return;
        }

        if (successMessage != null) {
          displayToast(successMessage, "success");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          displayToast(error.message, "error");
        }
      });
  };
}

export function usePlatform() {
  // navigator.platform isn't deprecated in the MDN docs anymore
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const platform = navigator.platform.toLowerCase();

  if (platform.includes("win")) {
    return "win";
  }

  if (platform.includes("mac")) {
    return "mac";
  }

  if (platform.includes("linux")) {
    return "linux";
  }

  return null;
}

export function useModifierKeyLabel() {
  return usePlatform() === "mac" ? "⌘" : "Ctrl";
}
