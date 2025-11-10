import ErrorPage from "@/components/error-page";
import FileList from "@/components/file-list";
import FilesPageContextMenu from "@/components/files-page-context-menu";
import UploadDropzone from "@/components/upload-dropzone";
import { FilesProvider } from "@/contexts/files-context";
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
          <FileList />
        </UploadDropzone>
      </FilesPageContextMenu>
    </FilesProvider>
  );
}
