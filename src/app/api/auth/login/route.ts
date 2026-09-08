import { NextResponse } from "next/server";
import { z } from "zod";

import { COOKIE_NAME, TOKEN_MAX_AGE_SECONDS, signToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await db.userProfile.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { ok: false, error: "This account has been deactivated. Contact an administrator." },
        { status: 403 },
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await signToken({
      profileId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during authentication." },
      { status: 500 },
    );
  }
}
