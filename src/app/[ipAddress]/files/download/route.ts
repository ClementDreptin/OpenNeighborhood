import type { NextRequest } from "next/server";
import path from "node:path";
import { Readable } from "node:stream";
import mime from "mime";
import { downloadFile } from "@/lib/consoles";

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
  const { size, stream } = await downloadFile(ipAddress, filePath, isDirectory);
  const contentType = isDirectory
    ? "application/zip"
    : (mime.getType(fileName) ?? "application/octet-stream");

  const headers = new Headers({
    "Content-Disposition": `attachment; filename=${fileName}${isDirectory ? ".zip" : ""}`,
    "Content-Type": contentType,
  });
  if (!isDirectory) {
    headers.set("Content-Length", size.toString());
  }

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
