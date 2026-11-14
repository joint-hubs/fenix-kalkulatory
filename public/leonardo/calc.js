// Calculation logic for the flying machine in Zgłoszenie Leonarda da Vinci.
// Pure module with named exports, no DOM here, so tests can import it.

export const RHO = 1.225; // kg/m3, air density at sea level
export const CL = 1.2; // wing lift coefficient
export const G = 9.81; // m/s2

export const STANDSTILL_MESSAGE = "Na postoju nikt nie lata. Podaj prędkość większą od zera.";
export const INVALID_MESSAGE = "Wpisz poprawne liczby: dodatnią masę i powierzchnię oraz prędkość od zera wzwyż.";

// A horse carries the speed: walk about 6, trot about 15, gallop about 45 km/h.
export const HORSE_PACES = [
  { name: "stęp", locative: "stępie", speedKmh: 6 },
  { name: "kłus", locative: "kłusie", speedKmh: 15 },
  { name: "cwał", locative: "cwale", speedKmh: 45 },
];

// Lift in kg: L = 0.5 * RHO * v^2 * S * CL, carried by mass * G on the ground.
export function liftKg(massKg, areaM2, speedKmh) {
  const v = speedKmh / 3.6;
  return (0.5 * RHO * v * v * areaM2 * CL) / G;
}

// Speed in km/h whose lift covers massKg on areaM2.
export function neededSpeedKmh(massKg, areaM2) {
  return Math.sqrt((2 * massKg * G) / (RHO * areaM2 * CL)) * 3.6;
}

// The pace whose speed is nearest to speedKmh; ties go to the slower pace.
export function horsePace(speedKmh) {
  let best = HORSE_PACES[0];
  for (const pace of HORSE_PACES) {
    if (Math.abs(speedKmh - pace.speedKmh) < Math.abs(speedKmh - best.speedKmh)) best = pace;
  }
  return best;
}

// Wingspan in sketch units: grows with the wing area, clamped so the sketch holds.
export function wingspanPx(areaM2) {
  const area = typeof areaM2 === "number" ? areaM2 : Number(String(areaM2 ?? "").trim().replace(",", "."));
  if (!Number.isFinite(area) || area <= 0) return 40;
  return Math.min(220, Math.max(40, Math.round(40 + 20 * Math.sqrt(area))));
}

function toNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").trim().replace(",", "."));
}

function kg(value) {
  return formatNumber(Math.round(value));
}

// Leonardo says it short: verdict, what the wings carry, what is missing,
// and how fast a horse would have to run for it.
export function verdictSpeech(result) {
  if (!result.ok) return result.error;
  if (result.standstill) return result.message;
  const lifted = kg(result.liftedKg);
  if (result.flies) {
    return `Wzleci! Skrzydła uniosą ${lifted} kg, zapas ${kg(result.liftedKg - result.massKg)} kg.`;
  }
  const pace = horsePace(result.neededSpeedKmh);
  const needed = kg(Math.round(result.neededSpeedKmh * 10) / 10);
  return `Nie wzleci. Skrzydła uniosą ${lifted} kg z ${kg(result.massKg)}, brakuje ${kg(result.missingKg)} kg. Potrzeba około ${needed} km/h, tyle co koń w ${pace.locative}.`;
}

// evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 }) ->
//   { ok: true, flies: false, verdict: "nie leci", liftedKg: 23.12, missingKg: 66.88,
//     neededSpeedKmh: 39.46, standstill: false, message: "",
//     speech: "Nie wzleci. Skrzydła uniosą 23 kg z 90, brakuje 67 kg. Potrzeba około 40 km/h, tyle co koń w cwale." }
// evaluate({ massKg: 90, areaM2: 10, speedKmh: 0 }) ->
//   { ok: true, standstill: true, message: "Na postoju nikt nie lata. ..." }
export function evaluate({ massKg, areaM2, speedKmh } = {}) {
  const mass = toNumber(massKg);
  const area = toNumber(areaM2);
  const speed = toNumber(speedKmh);
  if (!Number.isFinite(mass) || !Number.isFinite(area) || !Number.isFinite(speed)) {
    return { ok: false, error: INVALID_MESSAGE, speech: INVALID_MESSAGE };
  }
  if (mass <= 0 || area <= 0 || speed < 0) {
    return { ok: false, error: INVALID_MESSAGE, speech: INVALID_MESSAGE };
  }
  const liftedKg = liftKg(mass, area, speed);
  const flies = liftedKg >= mass;
  const result = {
    ok: true,
    flies,
    verdict: flies ? "leci" : "nie leci",
    massKg: mass,
    areaM2: area,
    speedKmh: speed,
    liftedKg,
    missingKg: Math.max(mass - liftedKg, 0),
    neededSpeedKmh: neededSpeedKmh(mass, area),
    standstill: speed === 0,
    message: speed === 0 ? STANDSTILL_MESSAGE : "",
  };
  result.speech = verdictSpeech(result);
  return result;
}

// Display form: trimmed float, Polish comma as the decimal separator.
export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded).replace(".", ",");
}
