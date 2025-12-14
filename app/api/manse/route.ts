import { NextResponse } from "next/server";
import { manseCalc } from "@/lib/manse";

/**
 * GET /api/manse
 * Calculates the four pillars (간지) for a given birth date/time.
 *
 * Required query params:
 * - y, m, d: Gregorian year, month, day
 * - hh, mm: hour and minute (24h)
 * Optional params:
 * - tz: timezone offset in hours (default 9)
 * - lon: longitude in degrees (default 126.98)
 * - lmt: use local mean time (boolean flag)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const requiredParams = ["y", "m", "d", "hh", "mm"] as const;
    const parsed: Record<string, number> = {};

    for (const key of requiredParams) {
      const raw = searchParams.get(key);
      if (raw === null) {
        return NextResponse.json({ error: `Missing required parameter: ${key}` }, { status: 400 });
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        return NextResponse.json({ error: `Invalid numeric value for ${key}: ${raw}` }, { status: 400 });
      }
      parsed[key] = value;
    }

    const { y, m, d, hh, mm } = parsed as { [k in (typeof requiredParams)[number]]: number };

    if (!Number.isInteger(y) || y < 1) {
      return NextResponse.json({ error: "Year (y) must be a positive integer." }, { status: 400 });
    }
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: "Month (m) must be an integer between 1 and 12." }, { status: 400 });
    }
    if (!Number.isInteger(d) || d < 1 || d > 31) {
      return NextResponse.json({ error: "Day (d) must be an integer between 1 and 31." }, { status: 400 });
    }
    if (!Number.isInteger(hh) || hh < 0 || hh > 23) {
      return NextResponse.json({ error: "Hour (hh) must be an integer between 0 and 23." }, { status: 400 });
    }
    if (!Number.isInteger(mm) || mm < 0 || mm > 59) {
      return NextResponse.json({ error: "Minute (mm) must be an integer between 0 and 59." }, { status: 400 });
    }

    const tzRaw = searchParams.get("tz");
    const lonRaw = searchParams.get("lon");
    const lmtRaw = searchParams.get("lmt");

    const tz = tzRaw === null ? 9 : Number(tzRaw);
    const lon = lonRaw === null ? 126.98 : Number(lonRaw);
    const useLmt = lmtRaw === "true" || lmtRaw === "1" || lmtRaw === "yes";

    if (!Number.isFinite(tz)) {
      return NextResponse.json({ error: `Invalid timezone (tz): ${tzRaw}` }, { status: 400 });
    }
    if (!Number.isFinite(lon)) {
      return NextResponse.json({ error: `Invalid longitude (lon): ${lonRaw}` }, { status: 400 });
    }

    const result = manseCalc(y, m, d, hh, mm, tz, lon, useLmt);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateString = `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)} (tz=${tz}${useLmt ? ", lmt" : ""}, lon=${lon})`;

    const ganji = {
      year: { hanja: result.year, reading: result.year },
      month: { hanja: result.month, reading: result.month },
      day: { hanja: result.day, reading: result.day },
      hour: { hanja: result.hour, reading: result.hour },
    };

    return NextResponse.json({ date: dateString, ganji });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
