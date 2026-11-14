// calc.js: the Arystoteles report on light travel time.
// Pure ES module with named exports so tests can import the logic without a DOM.

/** Speed of light in kilometres per second. */
export const LIGHT_SPEED_KMS = 299792.458;

/** One Julian year (365.25 days) in seconds; a light-year is light of that age. */
export const SECONDS_PER_YEAR = 31557600;

/** The five sky objects from the report, distances pinned in the ticket. */
export const OBJECTS = [
  { id: "ksiezyc", name: "Księżyc", nameGenitive: "Księżyca", distanceKm: 384400 },
  { id: "slonce", name: "Słońce", nameGenitive: "Słońca", distanceKm: 149597871 },
  { id: "syriusz", name: "Syriusz", nameGenitive: "Syriusza", lightYears: 8.6 },
  { id: "gwiazda-polarna", name: "Gwiazda Polarna", nameGenitive: "Gwiazdy Polarnej", lightYears: 433 },
  { id: "galaktyka-andromedy", name: "Galaktyka Andromedy", nameGenitive: "Galaktyki Andromedy", lightYears: 2500000 },
];

/** Look one object up by id; unknown ids are null. */
export function objectById(id) {
  return OBJECTS.find((object) => object.id === id) ?? null;
}

/** Light travel time in seconds. */
export function travelSeconds(object) {
  if (object.distanceKm !== undefined) return object.distanceKm / LIGHT_SPEED_KMS;
  return object.lightYears * SECONDS_PER_YEAR;
}

/** Light travel time in years. */
export function travelYears(object) {
  if (object.lightYears !== undefined) return object.lightYears;
  return object.distanceKm / LIGHT_SPEED_KMS / SECONDS_PER_YEAR;
}

/** The year the light departed: the given year minus the travel time. */
export function departureYear(currentYear, years) {
  return Math.round(currentYear - years);
}

const UNITS = {
  seconds: { one: "sekunda", few: "sekundy", many: "sekund", genitive: "sekundy" },
  minutes: { one: "minuta", few: "minuty", many: "minut", genitive: "minuty" },
  hours: { one: "godzina", few: "godziny", many: "godzin", genitive: "godziny" },
  days: { one: "dzień", few: "dni", many: "dni", genitive: "dnia" },
  years: { one: "rok", few: "lata", many: "lat", genitive: "roku" },
};

const SCALES = {
  million: { one: "milion", few: "miliony", many: "milionów", genitive: "miliona" },
  billion: { one: "miliard", few: "miliardy", many: "miliardów", genitive: "miliarda" },
};

const numberFormat = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

/** Polish noun form for a count: "1 rok", "2,5 roku", "433 lata", "500 lat". */
function wordFor(count, forms) {
  if (!Number.isInteger(count)) return forms.genitive;
  if (count === 1) return forms.one;
  const lastTwo = Math.abs(count) % 100;
  const last = Math.abs(count) % 10;
  if (lastTwo >= 12 && lastTwo <= 19) return forms.many;
  if (last >= 2 && last <= 4) return forms.few;
  return forms.many;
}

/** Count plus its noun, big counts in millions: "2,5 miliona lat". */
function counted(value, forms) {
  if (value >= 1e9) {
    const n = value / 1e9;
    return `${numberFormat.format(n)} ${wordFor(n, SCALES.billion)} ${forms.many}`;
  }
  if (value >= 1e6) {
    const n = value / 1e6;
    return `${numberFormat.format(n)} ${wordFor(n, SCALES.million)} ${forms.many}`;
  }
  return `${numberFormat.format(value)} ${wordFor(value, forms)}`;
}

/** Human-readable Polish duration, no scientific notation: "8,3 minuty". */
export function formatDuration(seconds) {
  if (seconds < 60) return counted(seconds, UNITS.seconds);
  if (seconds < 3600) return counted(seconds / 60, UNITS.minutes);
  if (seconds < 86400) return counted(seconds / 3600, UNITS.hours);
  if (seconds < SECONDS_PER_YEAR) return counted(seconds / 86400, UNITS.days);
  return counted(seconds / SECONDS_PER_YEAR, UNITS.years);
}

/** Calendar year as plain text; years before the common era get "p.n.e.". */
export function formatYear(year) {
  const rounded = Math.round(year);
  if (rounded > 0) return String(rounded);
  return `${numberFormat.format(1 - rounded)} p.n.e.`;
}

/**
 * The display model for one object: how long its light travelled, and (for
 * anything a year or more away) the year it departed. The current year is
 * always passed in, never read from the clock here.
 */
export function resultFor(objectOrId, currentYear) {
  const object = typeof objectOrId === "string" ? objectById(objectOrId) : objectOrId;
  if (!object) throw new TypeError(`unknown object: ${String(objectOrId)}`);
  const years = travelYears(object);
  const result = {
    id: object.id,
    name: object.name,
    durationText: formatDuration(travelSeconds(object)),
    departureYear: null,
    yearText: null,
  };
  if (years >= 1) {
    const year = departureYear(currentYear, years);
    result.departureYear = year;
    result.yearText = formatYear(year);
  }
  return result;
}

/**
 * One certain fact about the world near the year each star's light departed.
 * A small built-in table; the departure year itself is always computed.
 */
export const WORLD_FACTS = {
  "gwiazda-polarna": "Galileusz wykłada w Padwie",
  syriusz: "tej strony jeszcze nie było",
};

/**
 * Aristotle's short report on one object: a few plain sentences in his voice.
 * Stars also get the year their light departed and one certain fact of that
 * time from the table above. The current year is passed in, never read here.
 */
export function monologue(objectOrId, currentYear) {
  const object = typeof objectOrId === "string" ? objectById(objectOrId) : objectOrId;
  if (!object) throw new TypeError(`unknown object: ${String(objectOrId)}`);
  const result = resultFor(object, currentYear);
  const lines = [];
  switch (object.id) {
    case "ksiezyc":
      lines.push(`Światło ${object.nameGenitive} leciało do ciebie nieco ponad sekundę.`);
      lines.push("Patrzysz w przeszłość, choć bardzo młodą.");
      break;
    case "slonce":
      lines.push(`Światło ${object.nameGenitive} leciało do ciebie około 8 minut.`);
      lines.push("Uczyłem, że światło nie potrzebuje czasu.");
      lines.push("Myliłem się.");
      break;
    case "galaktyka-andromedy":
      lines.push(`Światło ${object.nameGenitive} leciało do ciebie ${result.durationText}.`);
      lines.push("Gdy to światło wyruszyło, nie było jeszcze naszego gatunku.");
      break;
    default:
      lines.push(`Światło ${object.nameGenitive} leciało do ciebie ${result.durationText}.`);
      lines.push(`Wyruszyło w roku ${result.yearText}.`);
      if (WORLD_FACTS[object.id]) lines.push(`Około ${result.yearText}: ${WORLD_FACTS[object.id]}.`);
  }
  return lines;
}
