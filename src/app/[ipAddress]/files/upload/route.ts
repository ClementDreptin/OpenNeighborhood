import { uploadFile } from "@/lib/consoles";

interface RouteInfo {
  params: Promise<{ ipAddress: string }>;
}

export async function POST(request: Request, { params }: RouteInfo) {
  const formData = await request.formData();
  const { ipAddress } = await params;

  const dirPath = formData.get("dirPath");
  if (typeof dirPath !== "string" || dirPath === "") {
    return new Response("dirPath needs to be of type string.", { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("file needs to be of type File.", { status: 400 });
  }

  try {
    await uploadFile(ipAddress, dirPath, file);
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Something went wrong.");

    return new Response(error.message, { status: 500 });
  }

  return new Response("success", { status: 201 });
}
