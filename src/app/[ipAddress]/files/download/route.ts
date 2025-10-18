import type { NextRequest } from "next/server";
import path from "node:path";
import { Readable } from "node:stream";
import archiver from "archiver";
import mime from "mime";
import { downloadDirectory, downloadFile } from "@/lib/consoles";

interface RouteInfo {
  params: Promise<{ ipAddress: string }>;
}

export async function GET(request: NextRequest, { params }: RouteInfo) {
  const { ipAddress } = await params;
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");
  const isDirectory = searchParams.get("isDirectory") === "true";

  if (filePath == null || filePath === "") {
    return new Response("You need to specify a 'path' search parameter.", {
      status: 400,
    });
  }

  const fileName = `${path.win32.basename(filePath)}${isDirectory ? ".zip" : ""}`;
  const headers = new Headers({
    "Content-Disposition": `attachment; filename=${fileName}`,
    "Content-Type": isDirectory
      ? "application/zip"
      : (mime.getType(fileName) ?? "application/octet-stream"),
  });

  let stream: Readable;

  // For directories, we need to return a zip archive
  if (isDirectory) {
    const archive = archiver("zip");

    // We don't use await here because otherwise all the data would have to be
    // read from the console first before being piped into the response
    downloadDirectory(ipAddress, filePath, archive)
      .then(() => archive.finalize())
      .catch((error: unknown) => {
        // Destroying the archive on error allows the download to be completely
        // canceled on the client
        archive.destroy(error instanceof Error ? error : undefined);
      });

    stream = archive;
  } else {
    const result = await downloadFile(ipAddress, filePath);
    stream = result.stream;
    headers.set("Content-Length", result.size.toString());

    // The console won't close the connection when sending the file is done so we need to
    // manually close the stream once we've sent all the data
    let bytesSent = 0;
    stream.on("data", (chunk: Buffer) => {
      bytesSent += chunk.byteLength;
      if (bytesSent >= result.size) {
        stream.destroy();
        stream.emit("end");
      }
    });
  }

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
