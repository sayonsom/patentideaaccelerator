import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Check if user exists (don't reveal whether the account exists)
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });

    if (user) {
      // TODO: Send actual password reset email via SES/Resend/etc.
      // For now, log it server-side for development
      console.log(`[forgot-password] Reset requested for: ${user.email}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
