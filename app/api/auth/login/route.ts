import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkAdminPassword, createSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  let ok = false;
  try {
    ok = checkAdminPassword(password);
  } catch {
    return NextResponse.json(
      { error: "El servidor no tiene configurada la contraseña de admin" },
      { status: 500 }
    );
  }

  if (!ok) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
