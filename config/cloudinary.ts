export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

export async function uploadImage(base64: string, folder = "tiburonazo"): Promise<string> {
  const formData = new FormData();
  formData.append("file", base64);
  formData.append("upload_preset", "tiburonazo_unsigned");
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url;
}
