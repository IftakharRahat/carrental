import { NextResponse } from "next/server";

import { getSessionActor } from "@/lib/auth/actor";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: actor.profileId,
      email: actor.email,
      name: actor.name,
      role: actor.role,
    },
  });
}
