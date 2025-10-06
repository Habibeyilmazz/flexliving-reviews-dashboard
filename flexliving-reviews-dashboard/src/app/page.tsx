"use client";

import { useEffect, useMemo, useState } from "react";
import type { NormalizedReview } from "@/lib/types";

type Filters = {
  q: string;
  onlyApproved: boolean;
  byListing: string; // "all" or listingId
  channel: "all" | "google" | "flex";
  category: "all" | string;
  time: "all" | "30d" | "90d";
  sort: "new" | "old" | "hi" | "lo";
};

export default function DashboardPage() {
  const [rows, setRows] = useState<NormalizedReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<Record<string | number, boolean>>({});

  const [f, setF] = useState<Filters>({
    q: "",
    onlyApproved: false,
    byListing: "all",
    channel: "all",
    category: "all",
    time: "all",
    sort: "new",
  });

  // ---- fetch reviews (mock/live behind your API)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/reviews/hostaway?limit=200")
      .then((r) => r.json())
      .then((j) => !cancelled && setRows(Array.isArray(j?.result) ? j.result : []))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- load approvals from localStorage
  useEffect(() => {
    const read = () => {
      try {
        const raw = JSON.parse(localStorage.getItem("approvals") || "{}");
        setApprovals(raw);
      } catch {
        setApprovals({});
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "approvals") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- listing & category options
  const listings = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.listingId, r.listingName));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => (r.categories ?? []).forEach((c) => c.category && set.add(c.category)));
    return ["all", ...[...set].sort()];
  }, [rows]);

  // ---- base scope = filtered by listing (used for the “Approved X / Y” summary)
  const baseScope = useMemo(
    () => (f.byListing === "all" ? rows : rows.filter((r) => r.listingId === f.byListing)),
    [rows, f.byListing]
  );

  // ---- pipeline filters for list
  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const now = Date.now();
    const ms = f.time === "30d" ? 30 * 86400_000 : f.time === "90d" ? 90 * 86400_000 : 0;

    let arr = baseScope.slice();

    if (q) {
      arr = arr.filter((r) => {
        const blob = [
          r.listingName,
          r.guestName,
          r.text,
          r.categories?.map((c) => `${c.category}:${c.rating}`).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    if (f.onlyApproved) arr = arr.filter((r) => approvals[String(r.reviewId)]);
    if (f.channel !== "all") arr = arr.filter((r) => r.channel === f.channel);
    if (f.category !== "all") {
      arr = arr.filter((r) => (r.categories ?? []).some((c) => c.category === f.category));
    }
    if (ms) arr = arr.filter((r) => +new Date(r.submittedAt) >= now - ms);

    arr.sort((a, b) => {
      if (f.sort === "new") return +new Date(b.submittedAt) - +new Date(a.submittedAt);
      if (f.sort === "old") return +new Date(a.submittedAt) - +new Date(b.submittedAt);
      if (f.sort === "hi") return (b.ratingOverall ?? 0) - (a.ratingOverall ?? 0);
      return (a.ratingOverall ?? 0) - (b.ratingOverall ?? 0);
    });

    return arr;
  }, [baseScope, approvals, f]);

  // ---- performance / trends (on approved within base scope)
  const perf = useMemo(() => {
    const appr = baseScope.filter((r) => approvals[String(r.reviewId)]);
    const last30 = appr.filter((r) => +new Date(r.submittedAt) >= Date.now() - 30 * 86400_000);
    const nums = appr
      .map((r) => r.ratingOverall)
      .filter((n): n is number => typeof n === "number");
    const avg = nums.length
      ? Math.round((nums.reduce((s, x) => s + x, 0) / nums.length) * 10) / 10
      : null;

    // “Top issues” = categories with the **lowest average** across approved reviews
    const agg = new Map<string, { sum: number; count: number }>();
    appr.forEach((r) =>
      (r.categories ?? []).forEach((c) => {
        const a = agg.get(c.category) ?? { sum: 0, count: 0 };
        a.sum += c.rating;
        a.count += 1;
        agg.set(c.category, a);
      })
    );
    const issues = [...agg.entries()]
      .map(([k, v]) => ({ k, avg: v.sum / v.count }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3);

    return {
      avg,
      approvedInScope: appr.length,
      totalInScope: baseScope.length,
      last30: last30.length,
      issues,
    };
  }, [baseScope, approvals]);

  const toggle = (id: number) => {
    const next = { ...approvals, [id]: !approvals[id] };
    setApprovals(next);
    localStorage.setItem("approvals", JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-900">
      {/* Flex-like top bar */}
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-semibold">Manager Dashboard</h1>

        {/* summary tiles */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-sm text-slate-500">Avg rating (approved)</div>
            <div className="text-2xl font-semibold">{perf.avg ?? "–"}</div>
            <div className="text-sm text-slate-500 mt-1">
              Approved {perf.approvedInScope} / {perf.totalInScope}
            </div>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-sm text-slate-500">Approved reviews</div>
            <div className="text-2xl font-semibold">{perf.approvedInScope}</div>
            <div className="text-xs text-slate-500 mt-1">{perf.last30} in last 30 days</div>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-sm text-slate-500">Top issues</div>
            {/* explanation */}
            <div className="text-xs text-slate-500 mb-1">
              (Lowest average category scores across approved reviews)
            </div>
            {perf.issues.length === 0 ? (
              <div className="text-slate-700">None</div>
            ) : (
              <ul className="text-slate-700 text-sm">
                {perf.issues.map((i) => (
                  <li key={i.k}>
                    {i.k} <span className="text-slate-500">({i.avg.toFixed(1)})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* controls */}
        <div className="mt-6 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            placeholder="Search text / guest / listing"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
          />

          <select
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            value={f.byListing}
            onChange={(e) => setF({ ...f, byListing: e.target.value })}
          >
            <option value="all">All listings</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            value={f.channel}
            onChange={(e) => setF({ ...f, channel: e.target.value as Filters["channel"] })}
          >
            <option value="all">All channels</option>
            <option value="google">Google</option>
            <option value="flex">Flex website</option>
          </select>

          <select
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value as Filters["category"] })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <select
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            value={f.time}
            onChange={(e) => setF({ ...f, time: e.target.value as Filters["time"] })}
          >
            <option value="all">All time</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select
            className="bg-white border rounded-md px-3 py-2 shadow-sm"
            value={f.sort}
            onChange={(e) => setF({ ...f, sort: e.target.value as Filters["sort"] })}
          >
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="hi">Highest rating</option>
            <option value="lo">Lowest rating</option>
          </select>
        </div>

        {/* only-approved toggle */}
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.onlyApproved}
            onChange={(e) => setF({ ...f, onlyApproved: e.target.checked })}
          />
          Only approved
        </label>

        {/* list */}
        <div className="mt-6 space-y-4">
          {loading && <div className="rounded-md border p-4 bg-white shadow-sm">Loading…</div>}

          {filtered.map((r) => (
            <div key={r.reviewId} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium text-slate-900">{r.listingName}</div>
                  <div className="text-slate-600 text-sm">
                    {r.guestName ?? "Guest"} — overall {r.ratingOverall ?? "N/A"}/10
                    {r.channel ? ` • ${r.channel}` : ""}
                    {r.type ? ` • ${r.type}` : ""}
                  </div>
                </div>
                <div className="text-slate-500">{new Date(r.submittedAt).toISOString().slice(0, 10)}</div>
              </div>

              <p className="mt-2 text-slate-800">{r.text || "No written comment."}</p>

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => toggle(r.reviewId)}
                  className={`text-sm rounded-md px-3 py-1 border ${
                    approvals[String(r.reviewId)]
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  {approvals[String(r.reviewId)] ? "Approved ✓" : "Approve"}
                </button>

                {/* VIEW PROPERTY PAGE LINK */}
                <a
                  className="text-sm text-[#184C43] underline underline-offset-2 hover:opacity-80"
                  href={`/property/${encodeURIComponent(r.listingId)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View property page →
                </a>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="rounded-md border p-4 bg-white shadow-sm text-slate-700">
              No reviews match these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
