import type { NextRequest } from "next/server";
import { PassThrough, Readable } from "node:stream";
import { screenshot } from "@/lib/consoles";

export async function GET(
  _: NextRequest,
  context: RouteContext<"/[ipAddress]/screenshot">,
) {
  const { ipAddress } = await context.params;

  const pngData = await screenshot(ipAddress);

  const headers = new Headers({
    "Content-Disposition": `attachment; filename=${ipAddress}-image.png`,
    "Content-Type": "image/png",
    "Content-Length": pngData.byteLength.toString(),
  });

  const stream = new PassThrough();
  stream.end(pngData);

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
