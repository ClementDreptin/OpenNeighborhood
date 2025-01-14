import type { NextRequest } from "next/server";
import path from "node:path";
import mime from "mime";
import * as xbdm from "@/lib/xbdm";

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
  const mimeType = mime.getType(fileName);

  const socket = await xbdm.connect(ipAddress);
  const reader = xbdm.createSocketReader(socket);
  await xbdm.readHeader(reader, "Connected");

  await xbdm.writeCommand(socket, `getfile name="${filePath}"`);

  await xbdm.readHeader(reader, "BinaryResponseFollows");

  const sizeBuffer = await reader.readBytes(4);
  const size = sizeBuffer.readUInt32LE();

  const stream = reader.streamRemainingData();

  return new Response(stream, {
    status: 200,
    headers: new Headers({
      "Content-Disposition": `attachment; filename=${fileName}`,
      "Content-Type": mimeType ?? "application/octet-stream",
      "Content-Length": size.toString(),
    }),
  });
}
