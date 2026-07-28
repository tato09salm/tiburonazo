import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// This file has been updated to use the 'uuid' package after installation.
// Please restart your dev server if you see any module not found errors.

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "VENDEDOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";
    if (!file) return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const uploadDir = join(process.cwd(), "public", "uploads", folder);

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al procesar imagen" }, { status: 500 });
  }
}
