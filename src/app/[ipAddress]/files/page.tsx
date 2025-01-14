import ErrorPage from "@/components/error-page";
import FileButton from "@/components/file-button";
import { getFiles } from "@/lib/consoles";
import type { PageProps } from "@/types/next";

export default async function FilesPage(props: PageProps) {
  const { ipAddress } = await props.params;
  const { path } = await props.searchParams;

  if (typeof path !== "string" || path.length === 0) {
    return <ErrorPage error={new Error("You need to specify a path.")} />;
  }

  let files;
  try {
    files = await getFiles(ipAddress, path);
  } catch (err) {
    return <ErrorPage error={err} />;
  }

  if (files.length === 0) {
    return <p className="text-center">This folder is empty.</p>;
  }

  return (
    <div className="grid grid-cols-autofill gap-4">
      {files.map((file) => (
        <FileButton key={file.name} file={file} />
      ))}
    </div>
  );
}
