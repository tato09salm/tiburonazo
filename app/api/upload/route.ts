import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "VENDEDOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = "tiburonazo_unsigned";

    const cloudFormData = new FormData();
    cloudFormData.append("file", file);
    cloudFormData.append("upload_preset", uploadPreset);
    cloudFormData.append("folder", "tiburonazo/products");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudFormData,
    });

    if (!res.ok) throw new Error("Error al subir imagen");
    const data = await res.json();
    return NextResponse.json({ url: data.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al procesar imagen" }, { status: 500 });
  }
}
