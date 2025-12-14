export const TEN_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const TWELVE_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export const KOREAN_STEMS: Record<string, string> = {
  '甲': '갑',
  '乙': '을',
  '丙': '병',
  '丁': '정',
  '戊': '무',
  '己': '기',
  '庚': '경',
  '辛': '신',
  '壬': '임',
  '癸': '계',
};

export const KOREAN_BRANCHES: Record<string, string> = {
  '子': '자',
  '丑': '축',
  '寅': '인',
  '卯': '묘',
  '辰': '진',
  '巳': '사',
  '午': '오',
  '未': '미',
  '申': '신',
  '酉': '유',
  '戌': '술',
  '亥': '해',
};

export function ganzhiFromIndex(i60: number): string {
  return TEN_STEMS[i60 % 10] + TWELVE_BRANCHES[i60 % 12];
}

export function ganzhiToKorean(gz: string): string {
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

export function gregorianToJD(y: number, m: number, d: number, h = 12, mi = 0, se = 0): number {
  let year = y;
  let month = m;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const frac = (h + mi / 60 + se / 3600) / 24;
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + B - 1524.5 + frac;
}

export function sunEclipticLongitudeDeg(JD: number): number {
  const T = (JD - 2451545.0) / 36525.0;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * (T ** 2);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * (T ** 2);
  const Mr = (M % 360) * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * (T ** 2)) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lam = trueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  return ((lam % 360) + 360) % 360;
}

function findTermTimeNear(year: number, targetDeg: number, guessMonth: number): number {
  const JD0 = gregorianToJD(year, guessMonth, 15, 0, 0, 0);
  let lo = JD0 - 40;
  let hi = JD0 + 40;
  const f = (jd: number) => ((sunEclipticLongitudeDeg(jd) - targetDeg + 540) % 360) - 180;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function yearPillar(JD_utc: number, civilYear: number): string {
  const lichun = findTermTimeNear(civilYear, 315.0, 2);
  const y = JD_utc >= lichun ? civilYear : civilYear - 1;
  return ganzhiFromIndex((y - 1984) % 60);
}

const STEM_START_FROM_YEAR_STEM: Record<string, string> = {
  '甲':'丙','己':'丙',
  '乙':'戊','庚':'戊',
  '丙':'庚','辛':'庚',
  '丁':'壬','壬':'壬',
  '戊':'甲','癸':'甲',
};

export function monthPillarFromLongitude(solarLongDeg: number, yearGz: string): string {
  const offset = (solarLongDeg - 315.0 + 360) % 360;
  const mIdx = Math.floor(offset / 30.0);
  const branch = TWELVE_BRANCHES[(2 + mIdx) % 12];
  const yStem = yearGz[0];
  const stemStart = STEM_START_FROM_YEAR_STEM[yStem];
  const s0 = TEN_STEMS.indexOf(stemStart);
  const stem = TEN_STEMS[(s0 + mIdx) % 10];
  return stem + branch;
}

const DAY_EPOCH_CONST = 50;
export function dayPillarLocalMidnight(y: number, m: number, d: number, tzHours: number): string {
  const jd0 = gregorianToJD(y, m, d, -tzHours, 0, 0);
  const idx = (Math.floor(jd0 + 0.5) + DAY_EPOCH_CONST) % 60;
  return ganzhiFromIndex(idx);
}

function lmtShiftMinutes(lonDeg: number, tzHours: number): number {
  return lonDeg * 4.0 - tzHours * 60.0;
}

export function hourPillar(dayGz: string, hour: number, minute: number, useLmt: boolean, lonDeg: number, tzHours: number): string {
  let minutes = hour * 60 + minute + (useLmt ? lmtShiftMinutes(lonDeg, tzHours) : 0);
  minutes = ((minutes % 1440) + 1440) % 1440;
  const offset = (minutes - 23 * 60 + 1440) % 1440;
  const eps = 1e-7;
  const offsetAdj = (offset - eps + 1440) % 1440;
  const binIdx = Math.floor(offsetAdj / 120);
  const branch = TWELVE_BRANCHES[binIdx];
  const startForZi: Record<string, string> = {
    '甲':'甲','己':'甲',
    '乙':'丙','庚':'丙',
    '丙':'戊','辛':'戊',
    '丁':'庚','壬':'庚',
    '戊':'壬','癸':'壬',
  };
  const s0 = TEN_STEMS.indexOf(startForZi[dayGz[0]]);
  const stem = TEN_STEMS[(s0 + binIdx) % 10];
  return stem + branch;
}

export function manseCalc(y: number, m: number, d: number, hh: number, mm: number, tz = 9, lon = 126.98, useLmt = false) {
  const JD_utc = gregorianToJD(y, m, d, hh - tz, mm, 0);
  const gzYear = yearPillar(JD_utc, y);
  const lam = sunEclipticLongitudeDeg(JD_utc);
  const gzMonth = monthPillarFromLongitude(lam, gzYear);
  const gzDay = dayPillarLocalMidnight(y, m, d, tz);
  const gzHour = hourPillar(gzDay, hh, mm, useLmt, lon, tz);
  return { year: gzYear, month: gzMonth, day: gzDay, hour: gzHour };
}

// ── Gregorian → Lunar (Chinese/Korean lunisolar; table-based) ───────────────
// Supported range: 1900-01-31 .. 2100-12-31 (common published table)
const LUNAR_INFO_1900 = [
  0x04BD8, 0x04AE0, 0x0A570, 0x054D5, 0x0D260, 0x0D950, 0x16554, 0x056A0,
  0x09AD0, 0x055D2, 0x04AE0, 0x0A5B6, 0x0A4D0, 0x0D250, 0x1D255, 0x0B540,
  0x0D6A0, 0x0ADA2, 0x095B0, 0x14977, 0x04970, 0x0A4B0, 0x0B4B5, 0x06A50,
  0x06D40, 0x1AB54, 0x02B60, 0x09570, 0x052F2, 0x04970, 0x06566, 0x0D4A0,
  0x0EA50, 0x06E95, 0x05AD0, 0x02B60, 0x186E3, 0x092E0, 0x1C8D7, 0x0C950,
  0x0D4A0, 0x1D8A6, 0x0B550, 0x056A0, 0x1A5B4, 0x025D0, 0x092D0, 0x0D2B2,
  0x0A950, 0x0B557, 0x06CA0, 0x0B550, 0x15355, 0x04DA0, 0x0A5B0, 0x14573,
  0x052B0, 0x0A9A8, 0x0E950, 0x06AA0, 0x0AEA6, 0x0AB50, 0x04B60, 0x0AAE4,
  0x0A570, 0x05260, 0x0F263, 0x0D950, 0x05B57, 0x056A0, 0x096D0, 0x04DD5,
  0x04AD0, 0x0A4D0, 0x0D4D4, 0x0D250, 0x0D558, 0x0B540, 0x0B5A0, 0x195A6,
  0x095B0, 0x049B0, 0x0A974, 0x0A4B0, 0x0B27A, 0x06A50, 0x06D40, 0x0AF46,
  0x0AB60, 0x09570, 0x04AF5, 0x04970, 0x064B0, 0x074A3, 0x0EA50, 0x06B58,
  0x05AC0, 0x0AB60, 0x096D5, 0x092E0, 0x0C960, 0x0D954, 0x0D4A0, 0x0DA50,
  0x07552, 0x056A0, 0x0ABB7, 0x025D0, 0x092D0, 0x0CAB5, 0x0A950, 0x0B4A0,
  0x0BAA4, 0x0AD50, 0x055D9, 0x04BA0, 0x0A5B0, 0x15176, 0x052B0, 0x0A930,
  0x07954, 0x06AA0, 0x0AD50, 0x05B52, 0x04B60, 0x0A6E6, 0x0A4E0, 0x0D260,
  0x0EA65, 0x0D530, 0x05AA0, 0x076A3, 0x096D0, 0x04BD7, 0x04AD0, 0x0A4D0,
  0x1D0B6, 0x0D250, 0x0D520, 0x0DD45, 0x0B5A0, 0x056D0, 0x055B2, 0x049B0,
  0x0A577, 0x0A4B0, 0x0AA50, 0x1B255, 0x06D20, 0x0ADA0, 0x14B63, 0x09370,
  0x049F8, 0x04970, 0x064B0, 0x168A6, 0x0EA50, 0x06B20, 0x1A6C4, 0x0AAE0,
  0x092E0, 0x0D2E3, 0x0C960, 0x0D557, 0x0D4A0, 0x0DA50, 0x05D55, 0x056A0,
  0x0A6D0, 0x055D4, 0x052D0, 0x0A9B8, 0x0A950, 0x0B4A0, 0x0B6A6, 0x0AD50,
  0x055A0, 0x0ABA4, 0x0A5B0, 0x052B0, 0x0B273, 0x06930, 0x07337, 0x06AA0,
  0x0AD50, 0x14B55, 0x04B60, 0x0A570, 0x054E4, 0x0D160, 0x0E968, 0x0D520,
  0x0DAA0, 0x16AA6, 0x056D0, 0x04AE0, 0x0A9D4, 0x0A2D0, 0x0D150, 0x0F252,
  0x0D520,
];

function lunarLeapMonth(year: number): number {
  return LUNAR_INFO_1900[year - 1900] & 0xF;
}

function lunarLeapDays(year: number): number {
  return lunarLeapMonth(year) === 0 ? 0 : (LUNAR_INFO_1900[year - 1900] & 0x10000) ? 30 : 29;
}

function lunarMonthDays(year: number, month: number): number {
  const info = LUNAR_INFO_1900[year - 1900];
  return (info & (0x10000 >> month)) ? 30 : 29;
}

function lunarYearDays(year: number): number {
  let days = 29 * 12;
  const info = LUNAR_INFO_1900[year - 1900];
  for (let month = 1; month <= 12; month++) {
    if (info & (0x10000 >> month)) days += 1;
  }
  return days + lunarLeapDays(year);
}

export function gregorianToLunar(y: number, m: number, d: number) {
  const base = new Date(1900, 0, 31);
  const target = new Date(y, m - 1, d);
  const minSupported = base;
  const maxSupported = new Date(2100, 11, 31);
  if (Number.isNaN(target.valueOf()) || target < minSupported || target > maxSupported) return null;

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
      return [lunarYear, lunarMonth, lunarDay, isLeap] as const;
    }
    offset -= monthDays;
    if (leapMonth && lunarMonth === leapMonth && !isLeap) {
      isLeap = true;
    } else {
      if (isLeap) isLeap = false;
      else lunarMonth += 1;
    }
  }
  return null;
}

// ── Luck cycles ─────────────────────────────────────────────────────────────
const TROPICAL_YEAR_DAYS = 365.242196;
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

function i60FromGanzhi(gz: string): number {
  const stem = TEN_STEMS.indexOf(gz[0]);
  const branch = TWELVE_BRANCHES.indexOf(gz[1]);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stem && i % 12 === branch) return i;
  }
  throw new Error(`Invalid ganzhi pair: ${gz}`);
}

function jdToGregorian(jd: number) {
  let newJd = jd + 0.5;
  const Z = Math.floor(newJd);
  const F = newJd - Z;
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
  if (second === 60) second = 59;
  return { year, month, day: dInt, hour, minute, second };
}

function termIndexFromLongitude(solarLongDeg: number): number {
  const offset = (solarLongDeg - 315.0 + 360) % 360;
  return Math.floor(offset / 30.0);
}

function termTimeCandidatesNear(birthYear: number, deg: number, guessMonth: number) {
  const years = [birthYear - 1, birthYear, birthYear + 1];
  return years.map((y) => findTermTimeNear(y, deg, guessMonth));
}

function nextPrevTermTimes(JD_birth_utc: number, birthYear: number, nextTerm: [number, string, number], prevTerm: [number, string, number]) {
  const [nextDeg, nextName, nextGuessM] = nextTerm;
  const [prevDeg, prevName, prevGuessM] = prevTerm;
  const eps = 1e-9;

  const nextCandidates = termTimeCandidatesNear(birthYear, nextDeg, nextGuessM);
  const nextAfter = nextCandidates.filter((jd) => jd > JD_birth_utc + eps);
  const JD_next = (nextAfter.length ? nextAfter : nextCandidates).reduce((a, b) => (a < b ? a : b));

  const prevCandidates = termTimeCandidatesNear(birthYear, prevDeg, prevGuessM);
  const prevBefore = prevCandidates.filter((jd) => jd < JD_birth_utc - eps);
  const JD_prev = (prevBefore.length ? prevBefore : prevCandidates).reduce((a, b) => (a > b ? a : b));

  return ([JD_next, nextName, nextDeg] as const, [JD_prev, prevName, prevDeg] as const);
}

function isYangStem(stem: string): boolean {
  return TEN_STEMS.indexOf(stem) % 2 === 0;
}

export function luckCyclesDirection(gzYear: string, isFemale: boolean): number {
  const yangYear = isYangStem(gzYear[0]);
  if (isFemale) return yangYear ? -1 : 1;
  return yangYear ? 1 : -1;
}

function isoFromDateParts(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

export function luckCyclesInfo(
  JD_birth_utc: number,
  birthYear: number,
  birthLocal: Date,
  gzMonth: string,
  direction: number,
  cycles = 10,
) {
  if (![1, -1].includes(direction)) throw new Error('direction must be +1 (forward) or -1 (backward)');

  const lam = sunEclipticLongitudeDeg(JD_birth_utc);
  const idx = termIndexFromLongitude(lam);
  const curTerm = TERMS12[idx];
  const nextTerm = TERMS12[(idx + 1) % 12];
  const prevTerm = TERMS12[idx];
  const [nextInfo, prevInfo] = nextPrevTermTimes(JD_birth_utc, birthYear, nextTerm, prevTerm);

  const jdIso = (jd: number) => {
    const { year, month, day, hour, minute, second } = jdToGregorian(jd);
    const pad = (v: number) => v.toString().padStart(2, '0');
    return `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`;
  };

  const startAgeYears = (days: number) => days / 3.0;
  const [JD_next, nextName, nextDeg] = nextInfo;
  const [JD_prev, prevName, prevDeg] = prevInfo;

  let JD_target: number;
  let termName: string;
  let termDeg: number;
  let days: number;
  let dirName: 'forward' | 'backward';
  if (direction === 1) {
    JD_target = JD_next;
    termName = nextName;
    termDeg = nextDeg;
    days = Math.max(0, JD_target - JD_birth_utc);
    dirName = 'forward';
  } else {
    JD_target = JD_prev;
    termName = prevName;
    termDeg = prevDeg;
    days = Math.max(0, JD_birth_utc - JD_target);
    dirName = 'backward';
  }

  const startYears = startAgeYears(days);
  const startDt = new Date(birthLocal.getTime() + startYears * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000);
  const base = i60FromGanzhi(gzMonth);

  const cyclesOut = Array.from({ length: cycles }, (_, idxCycle) => {
    const n = idxCycle + 1;
    const i60 = (base + direction * n + 600) % 60;
    const ageStart = startYears + (n - 1) * 10;
    const ageEnd = startYears + n * 10;
    const cycleStart = new Date(startDt.getTime() + (n - 1) * 10 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000);
    const cycleEnd = new Date(startDt.getTime() + n * 10 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000 - 1000);
    return {
      n,
      age_start: ageStart,
      age_end: ageEnd,
      date_start: isoFromDateParts(cycleStart),
      date_end: isoFromDateParts(cycleEnd),
      pillar: ganzhiFromIndex(i60),
    };
  });

  const luckCyclesStartDate = isoFromDateParts(startDt);
  const luckCyclesEndDate = isoFromDateParts(new Date(startDt.getTime() + cycles * 10 * TROPICAL_YEAR_DAYS * 24 * 3600 * 1000 - 1000));

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
    to_term: { name: termName, deg: termDeg, jd_utc: direction === 1 ? JD_next : JD_prev, utc: jdIso(direction === 1 ? JD_next : JD_prev) },
    days,
    start_age_years: startYears,
    start_age: startYears,
    date_start: luckCyclesStartDate,
    date_end: luckCyclesEndDate,
    cycles: cyclesOut,
  };
}

