// src/lib/hostaway.ts
import type { NormalizedReview, CategoryScore } from "./types";

// small helpers
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const slugify = (s: string) =>
  s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");

/**
 * For the assessment: Flex mainly surfaces reviews on Google
 * and their own site. We'll deterministically assign "google" or "flex"
 * so the dashboard can filter by channel.
 */
const pickChannel = (seed: string): "google" | "flex" => {
  const n = Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0));
  return n % 2 === 0 ? "google" : "flex";
};

export function normalizeHostaway(raw: any[]): NormalizedReview[] {
  return raw.map((r) => {
    const categories: CategoryScore[] = Array.isArray(r.reviewCategory)
      ? r.reviewCategory.map((c: any) => ({
          category: String(c?.category ?? ""),
          rating: Number(c?.rating ?? 0),
        }))
      : [];

    const categoryAvg = avg(categories.map((c) => c.rating));
    const overall = r?.rating == null ? categoryAvg : Number(r.rating);

    const listingName = String(r?.listingName ?? "").trim();
    const listingId = slugify(listingName || String(r?.id ?? ""));

    return {
      reviewId: Number(r?.id),
      listingId,
      listingName,

      type: r?.type as any,                  // 'guest-to-host' | 'host-to-guest'
      status: String(r?.status ?? "published"),
      submittedAt: String(r?.submittedAt ?? ""),

      ratingOverall: overall,
      categories,

      guestName: r?.guestName ? String(r.guestName) : undefined,
      text: r?.publicReview ? String(r.publicReview).trim() : undefined,

      channel: pickChannel(listingName),     // <-- mocked channel
    };
  });
}
