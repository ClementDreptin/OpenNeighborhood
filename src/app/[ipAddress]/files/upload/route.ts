import { uploadFile } from "@/lib/consoles";

export async function POST(request: Request) {
  const formData = await request.formData();

  const ipAddress = formData.get("ipAddress");
  if (typeof ipAddress !== "string") {
    return new Response("ipAddress needs to be of type string.", {
      status: 400,
    });
  }

  const dirPath = formData.get("dirPath");
  if (typeof dirPath !== "string") {
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

  return new Response("success", { status: 200 });
}
