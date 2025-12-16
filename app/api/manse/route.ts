import { NextResponse } from 'next/server';

import { buildResult, manseCalc, parseRequestParams } from '@/lib/manse';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { isFemale, y, m, d, hh, mm, tz, lon, useLmt, cycle } = parseRequestParams(url);
    const { gzYear, gzMonth, gzDay, gzHour, JDutc } = manseCalc(y, m, d, hh, mm, tz, lon, useLmt);
    const body = buildResult(
      y,
      m,
      d,
      hh,
      mm,
      gzYear,
      gzMonth,
      gzDay,
      gzHour,
      isFemale,
      JDutc,
      tz,
      lon,
      useLmt,
      cycle,
    );
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
