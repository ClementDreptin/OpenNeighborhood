import type { NextRequest } from "next/server";
import path from "node:path";
import { Readable } from "node:stream";
import archiver from "archiver";
import mime from "mime";
import { downloadDirectory, downloadFile } from "@/lib/consoles";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");
  const ipAddress = searchParams.get("ipAddress");
  const isDirectory = searchParams.get("isDirectory") === "true";

  if (filePath == null || filePath === "") {
    return new Response("You need to specify a 'path' search parameter.", {
      status: 400,
    });
  }
  if (ipAddress == null || ipAddress === "") {
    return new Response(
      "You need to specify an 'ipAddress' search parameter.",
      {
        status: 400,
      },
    );
  }

  const fileName = `${path.win32.basename(filePath)}${isDirectory ? ".zip" : ""}`;
  const headers = new Headers({
    "Content-Disposition": `attachment; filename=${fileName}`,
    "Content-Type": isDirectory
      ? "application/zip"
      : (mime.getType(fileName) ?? "application/octet-stream"),
  });

  let stream;

  // For directories, we need to return a zip archive
  if (isDirectory) {
    const archive = archiver("zip");

    // We don't use await here because otherwise all the data would have to be
    // read from the console first before being piped into the response
    downloadDirectory(ipAddress, filePath, archive)
      .then(() => archive.finalize())
      .catch((error: unknown) => {
        // Destroying the archive on error allow the download to be completely
        // on the client
        archive.destroy(error instanceof Error ? error : undefined);
      });

    stream = archive;
  } else {
    const result = await downloadFile(ipAddress, filePath);
    stream = result.stream;
    headers.set("Content-Length", result.size.toString());
  }

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
