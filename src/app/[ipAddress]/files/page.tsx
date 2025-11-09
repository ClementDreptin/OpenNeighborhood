import ErrorPage from "@/components/error-page";
import FileButton from "@/components/file-button";
import FilesContainer from "@/components/files-container";
import FilesPageContextMenu from "@/components/files-page-context-menu";
import UploadDropzone from "@/components/upload-dropzone";
import { FilesProvider } from "@/contexts/FilesContext";
import { getFiles } from "@/lib/consoles";

export default async function FilesPage(
  props: PageProps<"/[ipAddress]/files">,
) {
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
          <FilesContainer>
            {files.length > 0 ? (
              <div className="grid-cols-autofill grid auto-rows-min gap-4">
                {files.map((file) => (
                  <FileButton key={file.name} file={file} />
                ))}
              </div>
            ) : (
              <p className="text-center">This folder is empty.</p>
            )}
          </FilesContainer>
        </UploadDropzone>
      </FilesPageContextMenu>
    </FilesProvider>
  );
}
