import { NextResponse } from "next/server";

import {
  ganzhiToKorean,
  gregorianToJD,
  gregorianToLunar,
  luckCyclesDirection,
  luckCyclesInfo,
  manseCalc,
} from "@/lib/manse";

function parseDate(date: string | null) {
  if (!date) return null;
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function parseTime(time: string | null) {
  const value = time ?? "12:00";
  const parts = value.split(":").map(Number);
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [hh, mm] = parts;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function formatIso(y: number, m: number, d: number, hh: number, mm: number) {
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00`;
}

function normalizeAgeYears(ageYears: number | boolean) {
  if (typeof ageYears !== "number") return ageYears;
  const nearest = Math.round(ageYears);
  return Math.abs(ageYears - nearest) < 1e-9 ? nearest : ageYears;
}

function isoToYmdhm(stamp: string | null) {
  if (!stamp) return null;
  return stamp.replace("T", " ").slice(0, 16);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const tz = Number.parseFloat(searchParams.get("tz") ?? "9");
    const lon = Number.parseFloat(searchParams.get("lon") ?? "126.98");
    const useLmt = searchParams.get("lmt") === "true";
    const cycles = Number.parseInt(searchParams.get("cycle") ?? searchParams.get("cycles") ?? "10", 10);
    const sexParam = (searchParams.get("sex") ?? searchParams.get("gender") ?? "male").toLowerCase();
    const isFemale = sexParam.startsWith("f");

    const date = parseDate(dateParam);
    const time = parseTime(timeParam);

    if (!date || !time) {
      return NextResponse.json({ error: "Invalid or missing date/time" }, { status: 400 });
    }
    if (Number.isNaN(tz) || Number.isNaN(lon) || Number.isNaN(cycles)) {
      return NextResponse.json({ error: "Invalid numeric query parameter" }, { status: 400 });
    }

    const { y, m, d } = date;
    const { hh, mm } = time;
    const manse = manseCalc(y, m, d, hh, mm, tz, lon, useLmt);

    const JD_utc = gregorianToJD(y, m, d, hh - tz, mm, 0);
    const lunar = gregorianToLunar(y, m, d);
    const lunarStr = lunar ? formatIso(lunar[0], lunar[1], lunar[2], hh, mm) : null;
    const yoon = lunar ? Boolean(lunar[3]) : null;

    const verboseResult = {
      gregorian: formatIso(y, m, d, hh, mm),
      lunar: lunarStr,
      yoon,
      ganzhi: {
        year: manse.year,
        month: manse.month,
        day: manse.day,
        hour: manse.hour,
      },
      sex: isFemale ? "female" : "male",
      luck_cycles: luckCyclesInfo(
        JD_utc,
        y,
        new Date(y, m - 1, d, hh, mm, 0),
        manse.month,
        luckCyclesDirection(manse.year, isFemale),
        cycles,
      ),
    } as const;

    const cyclesSimple = (verboseResult.luck_cycles?.cycles ?? []).map((cycle) => ({
      start_age: normalizeAgeYears(cycle.age_start),
      start_date: isoToYmdhm(cycle.date_start),
      ganzhi: cycle.pillar,
      ganzhi_kor: ganzhiToKorean(cycle.pillar),
    }));

    const result = {
      date: `${formatIso(y, m, d, hh, mm).replace("T", " ")}`,
      korean: `${ganzhiToKorean(manse.year)}년 ${ganzhiToKorean(manse.month)}월 ${ganzhiToKorean(manse.day)}일 ${ganzhiToKorean(manse.hour)}시`,
      hanja: `${manse.year}년 ${manse.month}월 ${manse.day}일 ${manse.hour}시`,
      cycles: cyclesSimple,
      verbose: verboseResult,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
