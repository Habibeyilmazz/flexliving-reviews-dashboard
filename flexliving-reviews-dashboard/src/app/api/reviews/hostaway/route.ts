// src/app/api/reviews/hostaway/route.ts
import { NextResponse } from "next/server";
import { normalizeHostaway, slugify } from "@/lib/hostaway";
import mock from "@/data/hostaway-mock.json";

export const revalidate = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const listing = url.searchParams.get("listing")?.trim() || "";
  const token = process.env.HOSTAWAY_ACCESS_TOKEN;

  let raw: any[] = [];
  try {
    if (token) {
      const r = await fetch("https://api.hostaway.com/v1/reviews?limit=200", {
        headers: { Authorization: `Bearer ${token}`, "Cache-control": "no-cache" },
        next: { revalidate },
      });
      const j = await r.json();
      raw = Array.isArray(j?.result) ? j.result : [];
    } else {
      raw = Array.isArray(mock) ? mock : [mock];
    }
  } catch {
    raw = Array.isArray(mock) ? mock : [mock];
  }

  let data = normalizeHostaway(raw);

  if (listing) {
    data = data.filter(
      (d) => d.listingId === listing || d.listingName === listing || slugify(d.listingName) === listing
    );
  }

  return NextResponse.json({ result: data });
}
