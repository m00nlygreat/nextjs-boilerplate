export const TEN_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const TWELVE_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export function ganzhiFromIndex(i60: number): string {
  return TEN_STEMS[i60 % 10] + TWELVE_BRANCHES[i60 % 12];
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

