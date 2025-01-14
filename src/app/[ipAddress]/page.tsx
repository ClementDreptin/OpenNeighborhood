import DriveButton from "@/components/drive-button";
import ErrorPage from "@/components/error-page";
import { getDrives } from "@/lib/consoles";
import type { PageProps } from "@/types/next";

export default async function DrivesPage(props: PageProps) {
  const { ipAddress } = await props.params;

  let drives;
  try {
    drives = await getDrives(ipAddress);
  } catch (err) {
    return <ErrorPage error={err} />;
  }

  if (drives.length === 0) {
    return <p className="text-center">This console doesn't have any drives.</p>;
  }

  return (
    <div className="grid grid-cols-autofill gap-4">
      {drives.map((drive) => (
        <DriveButton key={drive.name} drive={drive} />
      ))}
    </div>
  );
}
