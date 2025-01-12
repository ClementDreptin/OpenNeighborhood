import DriveButton from "@/components/drive-button";
import ErrorPage from "@/components/error-page";
import { getDrives } from "@/lib/consoles";
import { PageProps } from "@/types/next";

export default async function DrivesPage(props: PageProps) {
  const { ipAddress } = await props.params;

  let drives;
  try {
    drives = await getDrives(ipAddress);
  } catch (err) {
    return <ErrorPage error={err} />;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {drives.map((drive) => (
        <DriveButton key={drive.name} drive={drive} />
      ))}
    </div>
  );
}
