"use client";

import { useEffect, useMemo, useState } from "react";

type NormalizedReview = {
  reviewId: number;
  listingId: string;         // slug id (e.g., 2B-N1A-29-Shoreditch-Heights)
  listingName: string;       // human name
  ratingOverall: number | null; // 0–10 or null
  submittedAt: string;       // ISO-ish
  guestName?: string;
  text?: string;             // ⬅️ mapped from Hostaway 'publicReview'
  // needed to filter properly for public page:
  type?: string;             // 'guest-to-host' | 'host-to-guest'
  status?: string;           // 'published' | 'pending' | ...
};

export default function PropertyClient({ id }: { id: string }) {
  const [rows, setRows] = useState<NormalizedReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- approvals (localStorage) ----
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const read = () => {
      try { setApprovals(JSON.parse(localStorage.getItem("approvals") || "{}")); }
      catch { setApprovals({}); }
    };
    read();
    const onStorage = (e: StorageEvent) => { if (e.key === "approvals") read(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- fetch reviews for this listing ----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // We request by listing slug. Even if API doesn’t support ?type,
    // we still filter on the client below.
    fetch(`/api/reviews/hostaway?listing=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((j) => { if (!cancelled) setRows(Array.isArray(j?.result) ? j.result : []); })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [id]);

  // ---- public-page rule: only show approved + guest-to-host + published ----
  const visibleReviews = useMemo(
    () =>
      rows
        .filter((r) => r.type === "guest-to-host")          // ✅ guest reviewed host/property
        .filter((r) => (r.status ?? "published") === "published")
        .filter((r) => Boolean(approvals[String(r.reviewId)]))
        .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)),
    [rows, approvals]
  );

  // ---- average rating of visible reviews (0–10 rounded to 1 decimal) ----
  const avgApproved =
    visibleReviews.length > 0
      ? Math.round(
          (visibleReviews.reduce((s, r) => s + (r.ratingOverall ?? 0), 0) /
            visibleReviews.length) * 10
        ) / 10
      : null;

  // 0–10 → 0–5 stars (with halves)
  function Stars5({ score10 }: { score10: number | null }) {
    if (score10 == null) return null;
    const five = Math.round((score10 / 2) * 2) / 2; // halves
    const full = Math.floor(five);
    const half = five - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center gap-1" aria-label={`${five}/5`}>
        {Array.from({ length: full }).map((_, i) => <span key={`full-${i}`}>★</span>)}
        {half && <span>☆</span>}
        {Array.from({ length: empty }).map((_, i) => <span key={`empty-${i}`}>☆</span>)}
        <span className="text-sm text-slate-700 ml-2">{five.toFixed(1)}/5</span>
      </div>
    );
  }

  const title = id.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Flex-like header */}
      <div className="w-full bg-[#184C43] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-semibold tracking-wide">the flex.</div>
          <nav className="hidden md:flex gap-6 text-sm opacity-90">
            <span>Landlords</span>
            <span>About Us</span>
            <span>Contact</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Image placeholders */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 aspect-[16/9] rounded-2xl bg-slate-200" />
          <div className="grid gap-4">
            <div className="aspect-video rounded-2xl bg-slate-200" />
            <div className="aspect-video rounded-2xl bg-slate-200" />
          </div>
        </div>

        {/* Title & quick facts */}
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold text-slate-800">
          {title} <span className="opacity-60">— The Flex London</span>
        </h1>

        <div className="mt-3 flex flex-wrap gap-6 items-center text-slate-800">
          <span>2 Bedrooms</span>
          <span>1 Bathroom</span>
          <span>Up to 5 guests</span>
          {avgApproved !== null && (
            <span className="inline-flex items-center gap-2">
              <Stars5 score10={avgApproved} />
              <span className="text-sm text-slate-700">
                (avg {avgApproved}/10 from approved)
              </span>
            </span>
          )}
        </div>

        {/* Content grid */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            <section className="bg-white rounded-2xl border shadow-sm p-5">
              <h2 className="text-xl font-semibold mb-2 text-slate-800">About this property</h2>
              <p className="text-slate-700">
                This apartment is spacious, bright, and has everything you need for a comfortable stay.
                It’s close to shops, cafes, and transport links.
              </p>
            </section>

            {/* Amenities */}
            <section className="bg-white rounded-2xl border shadow-sm p-5">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Amenities</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-slate-700 text-sm">
                <li>Wi-Fi</li><li>Washing Machine</li><li>Heating</li><li>Kitchen</li>
                <li>Smoke Detector</li><li>Elevator</li>
              </ul>
            </section>

            {/* Policies */}
            <section className="bg-white rounded-2xl border shadow-sm p-5">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Stay Policies</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-slate-800 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">No smoking</div>
                <div className="bg-slate-50 rounded-xl p-3">No parties or events</div>
                <div className="bg-slate-50 rounded-xl p-3">Check-in 3:00 PM</div>
                <div className="bg-slate-50 rounded-xl p-3">Check-out 10:00 AM</div>
              </div>
            </section>

            {/* Reviews */}
            <section id="reviews" className="mt-2">
              <div className="border-b-2 border-lime-400 pb-3 mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">Guest Reviews</h2>
                <p className="text-sm text-slate-700">
                  
                </p>
              </div>

              {loading && (
                <div className="bg-white border rounded-xl p-4">Loading…</div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                  Couldn’t load reviews: {error}
                </div>
              )}

              <div className="space-y-3">
                {visibleReviews.map((r) => (
                  <article key={r.reviewId} className="bg-white border rounded-xl shadow-sm p-4">
                    <div className="flex justify-between">
                      <div className="font-medium text-slate-900">{r.guestName || "Guest"}</div>
                      <div className="text-sm text-slate-700">
                        {new Date(r.submittedAt).toISOString().slice(0, 10)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      Overall: {r.ratingOverall ?? "N/A"}/10
                    </div>
                    <p className="mt-2 text-slate-800">
                      {r.text || "No written comment provided."}
                    </p>
                  </article>
                ))}
              </div>

              {!loading && !error && visibleReviews.length === 0 && (
                <div className="rounded-xl border p-6 text-slate-700 bg-slate-50 mt-4">
                  No approved guest-to-host reviews yet.
                </div>
              )}
            </section>
          </div>

          {/* Booking card (visual only) */}
          <aside className="bg-[#184C43] text-white rounded-2xl p-5 h-fit shadow-sm">
            <h3 className="text-lg font-semibold">Book Your Stay</h3>
            <p className="text-sm opacity-90">Select dates to see prices</p>
            <div className="mt-4 space-y-3">
              <div className="bg-white/10 rounded-lg p-3 text-sm">Select dates</div>
              <div className="bg-white/10 rounded-lg p-3 text-sm">Guests</div>
              <button className="w-full bg-white text-[#184C43] font-medium rounded-lg py-2">
                Check availability
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
