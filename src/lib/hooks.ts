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

  return searchParams.get("path") ?? "";
}

export function useActionToast(action: FormAction) {
  return (formData: FormData, successMessage?: React.ReactNode) => {
    action(formData)
      .then((result) => {
        if (result.error != null) {
          displayToast(result.error.message, "error");
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
