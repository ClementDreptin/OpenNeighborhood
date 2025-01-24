import type { NextRequest } from "next/server";
import path from "node:path";
import { Readable } from "node:stream";
import archiver from "archiver";
import { downloadFile } from "@/lib/consoles";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");
  const ipAddress = searchParams.get("ipAddress");

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
  const zipFileName = `${fileName}.zip`;
  const { stream } = await downloadFile(ipAddress, filePath);

  const archive = archiver("zip");
  archive.append(stream, { name: fileName });
  archive.finalize().catch(console.error);

  return new Response(
    Readable.toWeb(archive) as unknown as globalThis.ReadableStream,
    {
      status: 200,
      headers: new Headers({
        "Content-Disposition": `attachment; filename=${zipFileName}`,
        "Content-Type": "application/zip",
      }),
    },
  );
}
