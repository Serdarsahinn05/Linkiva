import { NextResponse } from "next/server";
import { getAnalytics, isRange } from "@/features/analytics/queries";
import { auth } from "@/lib/auth";
import { csvCell } from "@/lib/csv";
import { db } from "@/lib/db";

/** Daily views/clicks of the caller's own profile for the selected range, as CSV. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const profile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true, timezone: true, username: true } });
  if (!profile) return new NextResponse("Not found", { status: 404 });

  const rawRange = new URL(request.url).searchParams.get("range");
  const range = isRange(rawRange) ? rawRange : "30d";
  const data = await getAnalytics(profile, range, "en");

  const lines = ["date,views,clicks", ...data.series.map((d) => `${d.day},${d.views},${d.clicks}`), "", "link,clicks", ...data.links.map((l) => `${csvCell(l.title)},${l.clicks}`)];
  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkiva-${profile.username}-${range}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
