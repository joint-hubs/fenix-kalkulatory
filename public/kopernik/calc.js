// Heliocentric planet positions after the tables of Copernicus (FOC-1828).
// Pure module with named exports, no DOM here, so tests can import it.
//
// Source: JPL "Approximate Positions of the Planets" (Standish), Table 2a/2b,
// elements referred to the J2000 mean ecliptic and equinox. Kepler's equation
// is solved in degrees; positions are then rotated to the ecliptic of date
// via the precession angle p(T) = 1.397*T + 0.00031*T^2 degrees.

export const AU_KM = 149597871; // 1 astronomical unit in km
export const C_KM_S = 299792.458; // speed of light, km/s
export const AU_LIGHT_TIME_S = AU_KM / C_KM_S; // 499.00478 s

export const MIN_YEAR = 1500;
export const MAX_YEAR = 2100;

// The calendar switched on 15.10.1582: before that, Julian; from that day, Gregorian.
export const CALENDAR_SWITCH_JD = 2299160.5; // JD at 00:00 on 15.10.1582 (Gregorian)
export const GREGORIAN_EPOCH_JD = 2451545.0; // JD at 00:00 on 1.01.2000 (Gregorian)

export const RANGE_MESSAGE =
  "Podaj datę z lat 1500 do 2100. Kalkulator liczy wyłącznie w tym przedziale.";
export const MISSING_DATE_MESSAGE = "Podaj pełną datę: dzień, miesiąc i rok.";
export const NONEXISTENT_DATE_MESSAGE =
  "Takiego dnia nie ma: w 1582 roku, gdy jednocześnie wprowadzono kalendarz gregoriański, dni od 5 do 14 października pominięto.";
export const INVALID_DATE_MESSAGE =
  "Takiego dnia nie ma w kalendarzu. Sprawdź dzień i miesiąc: miesiące mają od 28 do 31 dni.";

// Planets the calculator offers, in Copernicus's order of distance from the Sun.
export const PLANETS = [
  { id: "merkury", name: "Merkury", key: "mercury" },
  { id: "wenus", name: "Wenus", key: "venus" },
  { id: "mars", name: "Mars", key: "mars" },
  { id: "jowisz", name: "Jowisz", key: "jupiter" },
  { id: "saturn", name: "Saturn", key: "saturn" },
];

// Zodiac signs in Polish, 30 degrees each, starting at 0 degrees = Baran.
export const ZODIAC = [
  "Baran",
  "Byk",
  "Bliźnięta",
  "Rak",
  "Lew",
  "Panna",
  "Waga",
  "Skorpion",
  "Strzelec",
  "Koziorożec",
  "Wodnik",
  "Ryby",
];

// Genitive and locative forms of the signs, for "po początku Ryb" (K15)
// and "stoi w Rybach" (K14). Same order as ZODIAC.
export const ZODIAC_GENITIVE = [
  "Barana",
  "Byka",
  "Bliźniąt",
  "Raka",
  "Lwa",
  "Panny",
  "Wagi",
  "Skorpiona",
  "Strzelca",
  "Koziorożca",
  "Wodnika",
  "Ryb",
];
export const ZODIAC_LOCATIVE = [
  "Baranie",
  "Byku",
  "Bliźniętach",
  "Raku",
  "Lwie",
  "Pannie",
  "Wadze",
  "Skorpionie",
  "Strzelcu",
  "Koziorożcu",
  "Wodniku",
  "Rybach",
];

// JPL Table 2a: value at J2000 and change per century.
// Order of the fields: a, aDot, e, eDot, I, IDot, L, LDot, peri, periDot, node, nodeDot.
export const JPL_ELEMENTS = {
  mercury: [
    0.38709843, 0.0, 0.20563661, 0.00002123, 7.00559432, -0.00590158,
    252.25166724, 149472.67486623, 77.45771895, 0.15940013, 48.33961819,
    -0.12214182,
  ],
  venus: [
    0.72332102, -0.00000026, 0.00676399, -0.00005107, 3.39777545, 0.00043494,
    181.97970850, 58517.81560260, 131.76755713, 0.05679648, 76.67261496,
    -0.27274174,
  ],
  earth: [
    1.00000018, -0.00000003, 0.01673163, -0.00003661, -0.00054346, -0.01337178,
    100.46691572, 35999.37306329, 102.93005885, 0.31795260, -5.11260389,
    -0.24123856,
  ],
  mars: [
    1.52371243, 0.00000097, 0.09336511, 0.00009149, 1.85181869, -0.00724757,
    -4.56813164, 19140.29934243, -23.91744784, 0.45223625, 49.71320984,
    -0.26852431,
  ],
  jupiter: [
    5.20248019, -0.00002864, 0.04853590, 0.00018026, 1.29861416, -0.00322699,
    34.33479152, 3034.90371757, 14.27495244, 0.18199196, 100.29282654,
    0.13024619,
  ],
  saturn: [
    9.54149883, -0.00003065, 0.05550825, -0.00032044, 2.49424102, 0.00451969,
    50.07571329, 1222.11494724, 92.86136063, 0.54179478, 113.63998702,
    -0.25015002,
  ],
};

// JPL Table 2b: extra terms for Jupiter and Saturn only.
export const JPL_EXTRA = {
  jupiter: { b: -0.00012452, c: 0.06064060, s: -0.35635438, f: 38.35125000 },
  saturn: { b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125000 },
};

const DEG = Math.PI / 180;

export function normalize360(degrees) {
  return ((degrees % 360) + 360) % 360;
}

// ---------------------------------------------------------------------------
// Calendar: Julian before 15.10.1582, Gregorian from that day onward.
// ---------------------------------------------------------------------------

// Returns the Julian Day (at 12:00 UT) for a day/month/year in the calendar
// that was in force on that date, or null when the day does not exist.
export function julianDay(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  const gregorian = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  if (year === 1582 && month === 10 && day >= 5 && day <= 14) return null;
  const leap = gregorian
    ? (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    : year % 4 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const b = gregorian ? 2 - Math.floor(y / 100) + Math.floor(y / 400) : 0;
  return (
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5
  );
}

// Which calendar was in force on a date. Returns "gregoriański" or "juliański".
export function calendarName(year, month, day) {
  const gregorian = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  return gregorian ? "gregoriański" : "juliański";
}

// The date in the calendar in force, read back from the Julian Day.
export function dateFromJulianDay(jd) {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= CALENDAR_SWITCH_JD + 0.5) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day, fraction: f };
}

// ---------------------------------------------------------------------------
// Position of a planet: elements at date T, Kepler's equation, rotation.
// ---------------------------------------------------------------------------

// Elements of one planet at Julian centuries T from J2000 (Table 2a/2b).
export function elementsAt(key, T) {
  const e = JPL_ELEMENTS[key];
  const a = e[0] + e[1] * T;
  const ecc = e[2] + e[3] * T;
  const inc = e[4] + e[5] * T;
  let L = e[6] + e[7] * T;
  const peri = e[8] + e[9] * T;
  const node = e[10] + e[11] * T;
  const extra = JPL_EXTRA[key];
  if (extra) {
    L += extra.b * T * T + extra.c * Math.cos(extra.f * T * DEG) + extra.s * Math.sin(extra.f * T * DEG);
  }
  return { a, e: ecc, I: inc, L: normalize360(L), peri, node };
}

// Solves E - e*sin(E) = M for the eccentric anomaly, in degrees.
export function eccentricAnomaly(Mdeg, e) {
  const eStar = 57.29577951308232 * e;
  let E = Mdeg + eStar * Math.sin(Mdeg * DEG);
  for (let i = 0; i < 20; i += 1) {
    const dM = Mdeg - (E - eStar * Math.sin(E * DEG));
    const dE = dM / (1 - e * Math.cos(E * DEG));
    E += dE;
    if (Math.abs(dE) <= 1e-6) break;
  }
  return E;
}

// Heliocentric position of a planet in J2000 ecliptic coordinates, in au.
export function heliocentric(key, T) {
  const { a, e, I, L, peri, node } = elementsAt(key, T);
  const w = peri - node; // argument of perihelion
  const M = normalize360(L - peri);
  const E = eccentricAnomaly(M, e);
  const xp = a * (Math.cos(E * DEG) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E * DEG);
  const cw = Math.cos(w * DEG);
  const sw = Math.sin(w * DEG);
  const cn = Math.cos(node * DEG);
  const sn = Math.sin(node * DEG);
  const ci = Math.cos(I * DEG);
  const si = Math.sin(I * DEG);
  return {
    x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
    y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
    z: (sw * si) * xp + (cw * si) * yp,
  };
}

// Precession of the equinoxes from J2000 to the date, in degrees.
export function precession(T) {
  return 1.397 * T + 0.00031 * T * T;
}

// Longitude of date from a J2000 ecliptic longitude.
export function longitudeOfDate(lambdaJ2000, T) {
  return normalize360(lambdaJ2000 + precession(T));
}

// Sign of the zodiac for a longitude of date, in degrees.
export function zodiacFor(longitude) {
  const index = Math.floor(normalize360(longitude) / 30) % 12;
  return ZODIAC[index];
}

// Where inside the sign the planet stands, said in words for the page (K15):
// "5° po początku Ryb" near the start, "5° przed końcem Ryb" near the end.
export function signPosition(longitude) {
  const norm = normalize360(longitude);
  const index = Math.floor(norm / 30) % 12;
  const into = norm - index * 30;
  const gen = ZODIAC_GENITIVE[index];
  const rInto = Math.round(into);
  const rBefore = Math.round(30 - into);
  let text;
  if (rInto === 0) text = `dokładnie na początku ${gen}`;
  else if (rBefore === 0) text = `dokładnie na końcu ${gen}`;
  else if (into <= 15) text = `${rInto}° po początku ${gen}`;
  else text = `${rBefore}° przed końcem ${gen}`;
  return { sign: ZODIAC[index], index, into, text };
}

// ---------------------------------------------------------------------------
// Geocentric view: where the planet stands on the sky, and how far it is.
// ---------------------------------------------------------------------------

// Full picture for one planet at a Julian Day. All angles in degrees.
export function positionFor(key, jd) {
  const T = (jd - GREGORIAN_EPOCH_JD) / 36525;
  const planet = heliocentric(key, T);
  const earth = heliocentric("earth", T);
  const gx = planet.x - earth.x;
  const gy = planet.y - earth.y;
  const gz = planet.z - earth.z;
  const distanceAu = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const lambdaJ2000 = normalize360(Math.atan2(gy, gx) / DEG);
  const lambdaDate = longitudeOfDate(lambdaJ2000, T);
  const lightTimeS = distanceAu * AU_LIGHT_TIME_S;
  return {
    T,
    lambdaJ2000,
    lambdaDate,
    distanceAu,
    distanceKm: distanceAu * AU_KM,
    lightTimeS,
    lightTimeMin: lightTimeS / 60,
    zodiac: zodiacFor(lambdaDate),
  };
}

// ---------------------------------------------------------------------------
// Retrograde motion: is the planet's longitude of date smaller today than
// yesterday? Unwraps the 360 -> 0 wrap so a single-degree step is not a lie.
// ---------------------------------------------------------------------------

export function isRetrograde(key, jd) {
  const step = 1; // one day
  const now = positionFor(key, jd);
  const before = positionFor(key, jd - step);
  let diff = now.lambdaDate - before.lambdaDate;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return { retrograde: diff < 0, dailyMotion: diff };
}

// ---------------------------------------------------------------------------
// Copernicus's circular model: mean longitude on a circle, no Kepler ellipse.
// ---------------------------------------------------------------------------

// Model longitude of date and distance for one planet at a Julian Day.
// Copernicus's own picture: both the planet and the Earth ride mean circles
// (radius a, angle L), so the Earth position comes from its mean elements,
// not from the true Kepler position used for the real sky.
export function circularModel(key, jd) {
  const T = (jd - GREGORIAN_EPOCH_JD) / 36525;
  const { a, L } = elementsAt(key, T);
  const earth = elementsAt("earth", T);
  const px = a * Math.cos(L * DEG);
  const py = a * Math.sin(L * DEG);
  const ex = earth.a * Math.cos(earth.L * DEG);
  const ey = earth.a * Math.sin(earth.L * DEG);
  const dx = px - ex;
  const dy = py - ey;
  const distanceAu = Math.sqrt(dx * dx + dy * dy);
  const lambdaJ2000 = normalize360(Math.atan2(dy, dx) / DEG);
  const lambdaDate = longitudeOfDate(lambdaJ2000, T);
  return { modelLongitude: lambdaDate, modelDistanceAu: distanceAu };
}

// Top-down scene for the drawing (K13): Earth and planet in ecliptic-of-date
// coordinates (au), and where the circle model would put the planet.
export function sceneFor(key, jd) {
  const T = (jd - GREGORIAN_EPOCH_JD) / 36525;
  const p = precession(T) * DEG;
  const rot = (v) => ({
    x: v.x * Math.cos(p) - v.y * Math.sin(p),
    y: v.x * Math.sin(p) + v.y * Math.cos(p),
  });
  const planet = rot(heliocentric(key, T));
  const earth = rot(heliocentric("earth", T));
  const model = circularModel(key, jd);
  return {
    planet,
    earth,
    model: {
      x: model.modelDistanceAu * Math.cos(model.modelLongitude * DEG),
      y: model.modelDistanceAu * Math.sin(model.modelLongitude * DEG),
    },
  };
}

// ---------------------------------------------------------------------------
// User-facing result: everything the page shows for one date and planet.
// ---------------------------------------------------------------------------

function formatDate({ year, month, day }) {
  const names = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ];
  return `${day} ${names[month - 1]} ${year} roku`;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(".", ",");
}

// Thousands with spaces, decimals with a comma, independent of system locale.
export function formatKm(value) {
  if (!Number.isFinite(value)) return String(value);
  const [whole, frac] = Math.round(value).toString().split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac ? `${grouped},${frac}` : grouped;
}

// Distance in words a layperson can read (K15): millions of km with at most
// three significant digits, switching to billions past 1000 mln km.
export function formatMlnKm(km) {
  if (!Number.isFinite(km)) return String(km);
  const mln = km / 1e6;
  if (mln >= 1000) return `${formatNumber(Math.round(mln / 10) / 100)} mld km`;
  if (mln >= 100) return `${formatNumber(Math.round(mln))} mln km`;
  if (mln >= 10) return `${formatNumber(Math.round(mln * 10) / 10)} mln km`;
  return `${formatNumber(Math.round(mln * 100) / 100)} mln km`;
}

// The full result for one planet and one date. Throws TypeError with a
// readable Polish message when the date is out of range, incomplete or absent.
export function resultFor(planetId, day, month, year) {
  const planet = PLANETS.find((p) => p.id === planetId);
  if (!planet) throw new TypeError("Wybierz planetę: Merkury, Wenus, Mars, Jowisz albo Saturn.");
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    throw new TypeError(MISSING_DATE_MESSAGE);
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new TypeError(RANGE_MESSAGE);
  }
  const jd = julianDay(year, month, day);
  if (jd === null) {
    // Only the skipped days of October 1582 deserve the calendar-reform talk;
    // a nonsense day like 32 March gets a plain message instead (K11).
    if (year === 1582 && month === 10 && day >= 5 && day <= 14) {
      throw new TypeError(NONEXISTENT_DATE_MESSAGE);
    }
    throw new TypeError(INVALID_DATE_MESSAGE);
  }
  const jdNoon = jd + 0.5; // julianDay returns 00:00 UT, so noon is half a day later
  const picture = positionFor(planet.key, jdNoon);
  const retro = isRetrograde(planet.key, jdNoon);
  const model = circularModel(planet.key, jdNoon);
  const calendar = calendarName(year, month, day);
  const deg = (v) => `${formatNumber(v)}°`;
  const degreeDiff = (x, y) => {
    let d = x - y;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  const longitudeDiff = degreeDiff(picture.lambdaDate, model.modelLongitude);
  const distanceDiff = picture.distanceAu - model.modelDistanceAu;
  return {
    ok: true,
    planet: planet.name,
    planetId: planet.id,
    jd: jdNoon,
    calendar,
    dateText: formatDate({ year, month, day }),
    calendarNote: `Zastosowano kalendarz ${calendar}, obowiązujący w tym dniu.`,
    longitude: picture.lambdaDate,
    longitudeText: deg(picture.lambdaDate),
    zodiac: picture.zodiac,
    distanceAu: picture.distanceAu,
    distanceKm: picture.distanceKm,
    distanceText: `${formatKm(picture.distanceKm)} km`,
    lightTimeMin: picture.lightTimeMin,
    lightTimeText: `${formatNumber(picture.lightTimeMin)} min`,
    retrograde: retro.retrograde,
    retrogradeText: retro.retrograde ? "tak" : "nie",
    dailyMotion: retro.dailyMotion,
    modelLongitude: model.modelLongitude,
    modelLongitudeText: deg(model.modelLongitude),
    modelDistanceAu: model.modelDistanceAu,
    modelDistanceText: `${formatNumber(model.modelDistanceAu)} au`,
    longitudeDiff,
    distanceDiff,
  };
}
