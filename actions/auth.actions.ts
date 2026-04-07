"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetCode(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad no revelamos si el usuario existe o no
      return { success: true };
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos

    // Guardar en la base de datos (borrando códigos anteriores para ese email)
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    await prisma.passwordReset.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Enviar correo
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Código de recuperación de contraseña - TIBURONAZO",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #11ABC4; text-align: center;">TIBURONAZO</h2>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar con el proceso:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">Este código expirará en 2 minutos.</p>
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error al enviar código de recuperación:", error);
    return { error: "No se pudo enviar el correo de recuperación" };
  }
}

export async function validateResetCode(email: string, code: string) {
  try {
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRequest) {
      return { error: "El código es inválido o ha expirado" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al validar código:", error);
    return { error: "No se pudo validar el código" };
  }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  try {
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRequest) {
      return { error: "El código es inválido o ha expirado" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.delete({
        where: { id: resetRequest.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return { error: "No se pudo restablecer la contraseña" };
  }
}
