// src/lib/types.ts
export type CategoryScore = { category: string; rating: number };

export type NormalizedReview = {
  reviewId: number;

  // Listing identity
  listingId: string;        // slug, e.g. "2B-N1A-29-Shoreditch-Heights"
  listingName: string;

  // Review meta
  type?: "guest-to-host" | "host-to-guest";   // Hostaway 'type'
  status?: string;                             // 'published' | ...
  submittedAt: string;                         // ISO-ish

  // Scores
  ratingOverall: number | null;                // 0–10 or null
  categories?: CategoryScore[];                // per-category ratings

  // Content
  guestName?: string;
  text?: string;                               // Hostaway 'publicReview'

  // Mocked for filtering UX (Flex doesn’t use OTA marketplaces):
  channel?: "google" | "flex";                 // where the review would appear publicly
};
