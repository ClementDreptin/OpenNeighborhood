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

  const fileName = path.win32.basename(filePath);
  const headers = new Headers();

  let stream;
  if (isDirectory) {
    const archive = archiver("zip");
    await downloadDirectory(ipAddress, filePath, archive);
    archive.finalize().catch(console.error);
    stream = archive;

    headers.set("Content-Disposition", `attachment; filename=${fileName}.zip`);
    headers.set("Content-Type", "application/zip");
  } else {
    const result = await downloadFile(ipAddress, filePath);
    stream = result.stream;

    headers.set("Content-Disposition", `attachment; filename=${fileName}`);
    headers.set(
      "Content-Type",
      mime.getType(fileName) ?? "application/octet-stream",
    );
    headers.set("Content-Length", result.size.toString());
  }

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
