import ErrorPage from "@/components/error-page";
import FileButton from "@/components/file-button";
import FilesPageContextMenu from "@/components/files-page-context-menu";
import UploadDropzone from "@/components/upload-dropzone";
import { FilesProvider } from "@/contexts/FilesContext";
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

  return (
    <FilesProvider files={files}>
      <FilesPageContextMenu>
        <UploadDropzone>
          {files.length > 0 ? (
            <div className="grid auto-rows-min grid-cols-autofill gap-4">
              {files.map((file) => (
                <FileButton key={file.name} file={file} />
              ))}
            </div>
          ) : (
            <p className="text-center">This folder is empty.</p>
          )}
        </UploadDropzone>
      </FilesPageContextMenu>
    </FilesProvider>
  );
}
