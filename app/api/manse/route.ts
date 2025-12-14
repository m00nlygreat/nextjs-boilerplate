import { NextResponse } from 'next/server';

const TEN_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const TWELVE_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const KOREAN_STEMS: Record<string, string> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
};

const KOREAN_BRANCHES: Record<string, string> = {
  子: '자',
  丑: '축',
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
};

const LUNAR_INFO_1900 = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
  0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
  0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
  0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
  0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573,
  0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
  0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
  0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
  0x05ac0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
  0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
  0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
  0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
  0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370,
  0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0,
  0x0a6d0, 0x055d4, 0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50,
  0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, 0x06930, 0x07337, 0x06aa0,
  0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, 0x0e968, 0x0d520,
  0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const TERMS12: Array<[number, string, number]> = [
  [315.0, '입춘', 2],
  [345.0, '경칩', 3],
  [15.0, '청명', 4],
  [45.0, '입하', 5],
  [75.0, '망종', 6],
  [105.0, '소서', 7],
  [135.0, '입추', 8],
  [165.0, '백로', 9],
  [195.0, '한로', 10],
  [225.0, '입동', 11],
  [255.0, '대설', 12],
  [285.0, '소한', 1],
];

const TROPICAL_YEAR_DAYS = 365.242196;
const DAY_EPOCH_CONST = 50;

const STEM_START_FROM_YEAR_STEM: Record<string, string> = {
  甲: '丙',
  己: '丙',
  乙: '戊',
  庚: '戊',
  丙: '庚',
  辛: '庚',
  丁: '壬',
  壬: '壬',
  戊: '甲',
  癸: '甲',
};

function positiveMod(value: number, mod: number): number {
  return ((value % mod) + mod) % mod;
}

function ganzhiFromIndex(i60: number): string {
  return `${TEN_STEMS[positiveMod(i60, 10)]}${TWELVE_BRANCHES[positiveMod(i60, 12)]}`;
}

function ganzhiToKorean(gz: string): string {
  if (typeof gz !== 'string' || gz.length !== 2) {
    throw new Error(`Invalid ganzhi: ${gz}`);
  }
  const stem = KOREAN_STEMS[gz[0]];
  const branch = KOREAN_BRANCHES[gz[1]];
  if (!stem || !branch) {
    throw new Error(`Invalid ganzhi char: ${gz}`);
  }
  return stem + branch;
}

function gregorianToJd(y: number, m: number, d: number, h = 12, mi = 0, se = 0): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const frac = (h + mi / 60 + se / 3600) / 24.0;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + frac;
}

function sunEclipticLongitudeDeg(JD: number): number {
  const T = (JD - 2451545.0) / 36525.0;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T ** 2;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T ** 2;
  const Mr = ((M % 360) * Math.PI) / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lam = trueLong - 0.00569 - 0.00478 * Math.sin((omega * Math.PI) / 180);
  return positiveMod(lam, 360.0);
}

function findTermTimeNear(year: number, targetDeg: number, guessMonth: number): number {
  const JD0 = gregorianToJd(year, guessMonth, 15, 0, 0, 0);
  let lo = JD0 - 40;
  let hi = JD0 + 40;
  const f = (jd: number) => ((sunEclipticLongitudeDeg(jd) - targetDeg + 540) % 360) - 180;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

function yearPillar(JDutc: number, civilYear: number): string {
  const lichun = findTermTimeNear(civilYear, 315.0, 2);
  const y = JDutc >= lichun ? civilYear : civilYear - 1;
  return ganzhiFromIndex((y - 1984) % 60);
}

function monthPillarFromLongitude(solarLongDeg: number, yearGz: string): string {
  const offset = positiveMod(solarLongDeg - 315.0, 360.0);
  const mIdx = Math.floor(offset / 30.0);
  const branch = TWELVE_BRANCHES[(2 + mIdx) % 12];
  const yStem = yearGz[0];
  const stemStart = STEM_START_FROM_YEAR_STEM[yStem];
  const s0 = TEN_STEMS.indexOf(stemStart);
  const stem = TEN_STEMS[(s0 + mIdx) % 10];
  return stem + branch;
}

function dayPillarLocalMidnight(y: number, m: number, d: number, tzHours: number): string {
  const jd0 = gregorianToJd(y, m, d, -tzHours, 0, 0);
  const idx = (Math.floor(jd0 + 0.5) + DAY_EPOCH_CONST) % 60;
  return ganzhiFromIndex(idx);
}

function lmtShiftMinutes(lonDeg: number, tzHours: number): number {
  return lonDeg * 4.0 - tzHours * 60.0;
}

function hourPillar(dayGz: string, hour: number, minute: number, useLmt: boolean, lonDeg: number, tzHours: number): string {
  const minutes = hour * 60 + minute + (useLmt ? lmtShiftMinutes(lonDeg, tzHours) : 0.0);
  const wrapped = positiveMod(minutes, 1440.0);
  const offset = positiveMod(wrapped - 23 * 60, 1440.0);
  const eps = 1e-7;
  const offsetAdj = positiveMod(offset - eps, 1440.0);
  const binIdx = Math.floor(offsetAdj / 120.0);
  const branch = TWELVE_BRANCHES[binIdx];
  const startForZi: Record<string, string> = {
    甲: '甲',
    己: '甲',
    乙: '丙',
    庚: '丙',
    丙: '戊',
    辛: '戊',
    丁: '庚',
    壬: '庚',
    戊: '壬',
    癸: '壬',
  };
  const s0 = TEN_STEMS.indexOf(startForZi[dayGz[0]]);
  const stem = TEN_STEMS[(s0 + binIdx) % 10];
  return stem + branch;
}

function jdToGregorian(jd: number): [number, number, number, number, number, number] {
  jd += 0.5;
  let Z = Math.floor(jd);
  const F = jd - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const dInt = Math.floor(day);
  let frac = day - dInt;
  const hour = Math.floor(frac * 24);
  frac = frac * 24 - hour;
  const minute = Math.floor(frac * 60);
  frac = frac * 60 - minute;
  let second = Math.round(frac * 60);
  if (second === 60) {
    second = 59;
  }
  return [year, month, dInt, hour, minute, second];
}

function lunarLeapMonth(year: number): number {
  return LUNAR_INFO_1900[year - 1900] & 0xf;
}

function lunarLeapDays(year: number): number {
  if (lunarLeapMonth(year) === 0) return 0;
  return (LUNAR_INFO_1900[year - 1900] & 0x10000) ? 30 : 29;
}

function lunarMonthDays(year: number, month: number): number {
  const info = LUNAR_INFO_1900[year - 1900];
  return (info & (0x10000 >> month)) ? 30 : 29;
}

function lunarYearDays(year: number): number {
  let days = 29 * 12;
  const info = LUNAR_INFO_1900[year - 1900];
  for (let month = 1; month <= 12; month += 1) {
    if (info & (0x10000 >> month)) {
      days += 1;
    }
  }
  return days + lunarLeapDays(year);
}

function gregorianToLunar(y: number, m: number, d: number): [number, number, number, boolean] | null {
  const base = new Date(1900, 0, 31);
  const target = new Date(y, m - 1, d);
  const minSupported = base;
  const maxSupported = new Date(2100, 11, 31);
  if (Number.isNaN(target.getTime()) || target < minSupported || target > maxSupported) {
    return null;
  }
  let offset = Math.floor((target.getTime() - base.getTime()) / (24 * 3600 * 1000));
  let lunarYear = 1900;
  while (lunarYear < 2101) {
    const yearDays = lunarYearDays(lunarYear);
    if (offset < yearDays) break;
    offset -= yearDays;
    lunarYear += 1;
  }
  const leapMonth = lunarLeapMonth(lunarYear);
  let lunarMonth = 1;
  let isLeap = false;
  while (lunarMonth <= 12) {
    const monthDays = isLeap ? lunarLeapDays(lunarYear) : lunarMonthDays(lunarYear, lunarMonth);
    if (offset < monthDays) {
      const lunarDay = offset + 1;
      return [lunarYear, lunarMonth, lunarDay, isLeap];
    }
    offset -= monthDays;
    if (leapMonth && lunarMonth === leapMonth && !isLeap) {
      isLeap = true;
    } else {
      if (isLeap) {
        isLeap = false;
      }
      lunarMonth += 1;
    }
  }
  return null;
}

function termIndexFromLongitude(solarLongDeg: number): number {
  const offset = positiveMod(solarLongDeg - 315.0, 360.0);
  return Math.floor(offset / 30.0);
}

function termTimeCandidatesNear(birthYear: number, deg: number, guessMonth: number): number[] {
  return [birthYear - 1, birthYear, birthYear + 1].map((yVal) => findTermTimeNear(yVal, deg, guessMonth));
}

function nextPrevTermTimes(
  JDbirthUtc: number,
  birthYear: number,
  nextTerm: [number, string, number],
  prevTerm: [number, string, number],
) {
  const [nextDeg, nextName, nextGuessM] = nextTerm;
  const [prevDeg, prevName, prevGuessM] = prevTerm;
  const eps = 1e-9;

  const nextCandidates = termTimeCandidatesNear(birthYear, nextDeg, nextGuessM);
  let nextAfter = nextCandidates.filter((jd) => jd > JDbirthUtc + eps);
  if (nextAfter.length === 0) nextAfter = nextCandidates;
  const JDnext = nextAfter.reduce((min, jd) => (jd - JDbirthUtc < min - JDbirthUtc ? jd : min));

  const prevCandidates = termTimeCandidatesNear(birthYear, prevDeg, prevGuessM);
  let prevBefore = prevCandidates.filter((jd) => jd < JDbirthUtc - eps);
  if (prevBefore.length === 0) prevBefore = prevCandidates;
  const JDprev = prevBefore.reduce((max, jd) => (jd - JDbirthUtc > max - JDbirthUtc ? jd : max));

  return [
    [JDnext, nextName, nextDeg] as [number, string, number],
    [JDprev, prevName, prevDeg] as [number, string, number],
  ];
}

function isYangStem(stem: string): boolean {
  return TEN_STEMS.indexOf(stem) % 2 === 0;
}

function luckCyclesDirection(gzYear: string, isFemale: boolean): number {
  const yangYear = isYangStem(gzYear[0]);
  if (isFemale) {
    return yangYear ? -1 : 1;
  }
  return yangYear ? 1 : -1;
}

function i60FromGanzhi(gz: string): number {
  const s = TEN_STEMS.indexOf(gz[0]);
  const b = TWELVE_BRANCHES.indexOf(gz[1]);
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === s && i % 12 === b) return i;
  }
  throw new Error(`Invalid ganzhi pair: ${gz}`);
}

function luckCyclesInfo(
  JDbirthUtc: number,
  birthYear: number,
  birthLocal: Date,
  gzMonth: string,
  direction: number,
  cycles = 10,
) {
  if (![1, -1].includes(direction)) {
    throw new Error('direction must be +1 (forward) or -1 (backward)');
  }
  const lam = sunEclipticLongitudeDeg(JDbirthUtc);
  const idx = termIndexFromLongitude(lam);
  const curTerm = TERMS12[idx];
  const nextTerm = TERMS12[(idx + 1) % 12];
  const prevTerm = TERMS12[idx];
  const [nextInfo, prevInfo] = nextPrevTermTimes(JDbirthUtc, birthYear, nextTerm, prevTerm);
  const [JDnext, nextName, nextDeg] = nextInfo;
  const [JDprev, prevName, prevDeg] = prevInfo;

  const jdIso = (jd: number) => {
    const [y, m, d, hh, mm, ss] = jdToGregorian(jd);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y.toString().padStart(4, '0')}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:${pad(ss)}Z`;
  };
  const dtIsoLocal = (dt: Date) => dt.toISOString().slice(0, 19);
  const startAgeYears = (days: number) => days / 3.0;

  let JDtarget = JDnext;
  let termName = nextName;
  let termDeg = nextDeg;
  let days = Math.max(0, JDtarget - JDbirthUtc);
  let dirName = 'forward';
  if (direction === -1) {
    JDtarget = JDprev;
    termName = prevName;
    termDeg = prevDeg;
    days = Math.max(0, JDbirthUtc - JDtarget);
    dirName = 'backward';
  }

  const startYears = startAgeYears(days);
  const startDt = new Date(birthLocal.getTime() + startYears * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000);
  const base = i60FromGanzhi(gzMonth);

  const outCycles = Array.from({ length: cycles }, (_, idxCycle) => {
    const n = idxCycle + 1;
    const i60 = positiveMod(base + direction * n, 60);
    const ageStart = startYears + (n - 1) * 10.0;
    const ageEnd = startYears + n * 10.0;
    const cycleStart = new Date(startDt.getTime() + (n - 1) * 10.0 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000);
    const cycleEnd = new Date(startDt.getTime() + n * 10.0 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000 - 1000);
    return {
      n,
      age_start: ageStart,
      age_end: ageEnd,
      date_start: dtIsoLocal(cycleStart),
      date_end: dtIsoLocal(cycleEnd),
      pillar: ganzhiFromIndex(i60),
    };
  });

  const luckCyclesStartDate = dtIsoLocal(startDt);
  const luckCyclesEndDate = dtIsoLocal(new Date(startDt.getTime() + cycles * 10.0 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000 - 1000));

  return {
    rule: {
      term_set: '12-jeol (30deg steps from 315deg)',
      day_to_year: 3.0,
      tropical_year_days: TROPICAL_YEAR_DAYS,
      start_age_rounding: 'exact',
      first_cycle_from: 'month_pillar_next_or_prev',
      direction_rule: 'male/female + year-stem yin-yang',
    },
    direction: dirName,
    birth_longitude_deg: lam,
    current_term: { name: curTerm[1], deg: curTerm[0] },
    to_term: { name: termName, deg: termDeg, jd_utc: JDtarget, utc: jdIso(JDtarget) },
    days,
    start_age_years: startYears,
    start_age: startYears,
    date_start: luckCyclesStartDate,
    date_end: luckCyclesEndDate,
    cycles: outCycles,
  };
}

function manseCalc(y: number, m: number, d: number, hh: number, mm: number, tz: number, lon: number, useLmt = false) {
  const JDutc = gregorianToJd(y, m, d, hh - tz, mm, 0);
  const gzYear = yearPillar(JDutc, y);
  const lam = sunEclipticLongitudeDeg(JDutc);
  const gzMonth = monthPillarFromLongitude(lam, gzYear);
  const gzDay = dayPillarLocalMidnight(y, m, d, tz);
  const gzHour = hourPillar(gzDay, hh, mm, useLmt, lon, tz);
  return { gzYear, gzMonth, gzDay, gzHour, JDutc };
}

function parseCompactDatetime(stamp: string) {
  if (typeof stamp !== 'string') throw new Error('stamp must be a string');
  const trimmed = stamp.trim();
  if (trimmed.length !== 13) throw new Error('stamp must be 13 chars: xyyyymmddHHMM');
  const sexChar = trimmed[0];
  const isFemale = sexChar === 'f' || sexChar === 'F';
  if (!isFemale && sexChar !== 'm' && sexChar !== 'M') {
    throw new Error('stamp[0] must be m/M/f/F');
  }
  const digits = trimmed.slice(1);
  if (!/^\d{12}$/.test(digits)) throw new Error('stamp[1:] must be digits (yyyymmddHHMM)');
  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));
  const hh = Number(digits.slice(8, 10));
  const mm = Number(digits.slice(10, 12));
  if (m < 1 || m > 12) throw new Error('month out of range');
  if (d < 1 || d > 31) throw new Error('day out of range');
  if (hh < 0 || hh > 23) throw new Error('hour out of range');
  if (mm < 0 || mm > 59) throw new Error('minute out of range');
  return { isFemale, y, m, d, hh, mm };
}

function formatYmdhm(y: number, m: number, d: number, hh: number, mm: number) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${y.toString().padStart(4, '0')}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)}`;
}

function isoToYmdhm(stamp: string | null | undefined) {
  if (stamp == null) return null;
  if (typeof stamp !== 'string') throw new Error('stamp must be a string or null');
  return stamp.replace('T', ' ').slice(0, 16);
}

function normalizeAgeYears(ageYears: number | boolean) {
  if (typeof ageYears !== 'number' || Number.isNaN(ageYears)) return ageYears;
  const nearest = Math.round(ageYears);
  if (Math.abs(ageYears - nearest) < 1e-9) return nearest;
  return ageYears;
}

function buildResult(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  gzYear: string,
  gzMonth: string,
  gzDay: string,
  gzHour: string,
  isFemale: boolean,
  JDutc: number,
  tz: number,
  lon: number,
  useLmt: boolean,
  cycle: number,
) {
  const birthLocal = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const lunar = gregorianToLunar(y, m, d);
  const lunarStr = lunar ? new Date(Date.UTC(lunar[0], lunar[1] - 1, lunar[2], hh, mm)).toISOString().slice(0, 19) : null;
  const yoon = lunar ? !!lunar[3] : null;
  const verbose = {
    gregorian: birthLocal.toISOString().slice(0, 19),
    lunar: lunarStr,
    yoon,
    ganzhi: {
      year: gzYear,
      month: gzMonth,
      day: gzDay,
      hour: gzHour,
    },
    sex: isFemale ? 'female' : 'male',
    luck_cycles: luckCyclesInfo(
      JDutc,
      y,
      new Date(Date.UTC(y, m - 1, d, hh, mm)),
      gzMonth,
      luckCyclesDirection(gzYear, isFemale),
      cycle,
    ),
  };
  const cycles = (verbose.luck_cycles?.cycles || []).map((cycleInfo: any) => ({
    start_age: normalizeAgeYears(cycleInfo.age_start),
    start_date: isoToYmdhm(cycleInfo.date_start),
    ganzhi: cycleInfo.pillar,
    ganzhi_kor: ganzhiToKorean(cycleInfo.pillar),
  }));

  return {
    date: formatYmdhm(y, m, d, hh, mm),
    korean: `${ganzhiToKorean(gzYear)}년 ${ganzhiToKorean(gzMonth)}월 ${ganzhiToKorean(gzDay)}일 ${ganzhiToKorean(gzHour)}시`,
    hanja: `${gzYear}년 ${gzMonth}월 ${gzDay}일 ${gzHour}시`,
    cycles,
    verbose,
    params: {
      tz,
      lon,
      lmt: useLmt,
      cycle,
    },
  };
}

function parseRequestParams(url: URL) {
  const stamp = url.searchParams.get('stamp') || undefined;
  const dateParam = url.searchParams.get('date') || undefined;
  const timeParam = url.searchParams.get('time') || '12:00';
  const tz = Number(url.searchParams.get('tz') ?? '9');
  const lon = Number(url.searchParams.get('lon') ?? '126.98');
  const useLmt = ['true', '1', 'yes'].includes((url.searchParams.get('lmt') || '').toLowerCase());
  const cycle = Number(url.searchParams.get('cycle') ?? '10');
  const maleFlag = url.searchParams.get('male');
  const femaleFlag = url.searchParams.get('female');

  if (Number.isNaN(tz) || Number.isNaN(lon) || Number.isNaN(cycle)) {
    throw new Error('tz, lon, and cycle must be numbers');
  }
  if (maleFlag && femaleFlag) {
    throw new Error('male and female flags are mutually exclusive');
  }

  let isFemale = false;
  let y: number;
  let m: number;
  let d: number;
  let hh: number;
  let mm: number;

  if (stamp) {
    const parsed = parseCompactDatetime(stamp);
    ({ isFemale, y, m, d, hh, mm } = parsed);
  } else {
    if (!dateParam) throw new Error('date is required when stamp is absent');
    const [yy, mo, dd] = dateParam.split('-').map(Number);
    if ([yy, mo, dd].some((val) => Number.isNaN(val))) throw new Error('date must be YYYY-MM-DD');
    y = yy;
    m = mo;
    d = dd;
    const [hourStr, minuteStr] = timeParam.split(':');
    hh = Number(hourStr);
    mm = Number(minuteStr);
    if ([hh, mm].some((val) => Number.isNaN(val))) throw new Error('time must be HH:MM');
    isFemale = (femaleFlag ?? '').toLowerCase() === 'true';
  }

  return { isFemale, y, m, d, hh, mm, tz, lon, useLmt, cycle };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { isFemale, y, m, d, hh, mm, tz, lon, useLmt, cycle } = parseRequestParams(url);
    const { gzYear, gzMonth, gzDay, gzHour, JDutc } = manseCalc(y, m, d, hh, mm, tz, lon, useLmt);
    const body = buildResult(y, m, d, hh, mm, gzYear, gzMonth, gzDay, gzHour, isFemale, JDutc, tz, lon, useLmt, cycle);
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
