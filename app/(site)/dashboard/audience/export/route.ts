import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscribers } from "@/features/audience/queries";
import { csvCell } from "@/lib/csv";

/** CSV of the caller's own subscribers. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await getSubscribers(session.user.id);
  const csv = ["email,subscribed_at", ...rows.map((r) => `${csvCell(r.email)},${csvCell(r.createdAt.toISOString())}`)].join("\r\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkiva-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
