import { useParams, useSearchParams } from "next/navigation";

export function useIpAddress() {
  const { ipAddress } = useParams();

  return typeof ipAddress === "string" ? ipAddress : "";
}

export function useDirPath() {
  const searchParams = useSearchParams();

  return searchParams.get("path") ?? "";
}
