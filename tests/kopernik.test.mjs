import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  resultFor,
  julianDay,
  calendarName,
  precession,
  normalize360,
} from "../public/kopernik/calc.js";

function near(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: got ${actual}, expected ${expected} (+/- ${tolerance})`
  );
}

const pageHtml = readFileSync(
  new URL("../public/kopernik/index.html", import.meta.url),
  "utf8"
);
const pageCss = readFileSync(
  new URL("../public/kopernik/style.css", import.meta.url),
  "utf8"
);
const indexHtml = readFileSync(
  new URL("../public/index.html", import.meta.url),
  "utf8"
);

// --- Gotowe, gdy: K1 strona działa bez błędów JS, obsługuje klawiaturę i mysz, wygląda na 390 px, po polsku na "ty", bez półpauz, bez zapytań sieciowych po załadowaniu. ---
describe("K1: strona", () => {
  it("posiada formularz z polami sterowanymi klawiaturą i myszą oraz przyciskiem", () => {
    assert.match(pageHtml, /<form id="pytanie">/);
    assert.match(pageHtml, /<select id="planeta"/);
    assert.match(pageHtml, /<input type="number" id="dzien"/);
    assert.match(pageHtml, /<input type="number" id="miesiac"/);
    assert.match(pageHtml, /<input type="number" id="rok"/);
    assert.match(pageHtml, /<button type="submit">/);
  });

  it("ma arkusz stylów gotowy na wąski ekran 390 px", () => {
    assert.match(pageCss, /@media \(max-width/);
    assert.match(pageCss, /overflow-wrap: anywhere/);
  });

  it("mówi do użytkownika na ty i unika półpauz", () => {
    const copy = pageHtml.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(copy, /[–—]/);
    assert.match(copy, /Podaj mi planetę/);
  });

  it("nie ładuje żadnych zewnętrznych zasobów (statyczna strona, zero zapytań po starcie)", () => {
    assert.doesNotMatch(pageHtml, /https?:\/\//);
    assert.doesNotMatch(pageCss, /https?:\/\//);
    assert.doesNotMatch(pageCss, /@import/);
  });

  it("jest wpisany na listę kalkulatorów na stronie głównej", () => {
    assert.match(indexHtml, /<li><a href="kopernik\/">/);
  });
});

// --- Gotowe, gdy: K2 długość ekliptyczna planet dla dat referencyjnych mieści się w 1 stopniu. ---
describe("K2: długość ekliptyczna", () => {
  const cases = [
    { planet: "mars", label: "Mars 27.08.2003", day: 27, month: 8, year: 2003, lon: 335.35, sign: "Ryby" },
    { planet: "wenus", label: "Wenus 1.01.2026", day: 1, month: 1, year: 2026, lon: 279.84, sign: "Koziorożec" },
    { planet: "jowisz", label: "Jowisz 24.11.2026", day: 24, month: 11, year: 2026, lon: 146.47, sign: "Lew" },
    { planet: "merkury", label: "Merkury 24.11.2026", day: 24, month: 11, year: 2026, lon: 223.17, sign: "Skorpion" },
  ];

  for (const c of cases) {
    it(`${c.label}: ${c.lon} stopnia, znak ${c.sign}`, () => {
      const r = resultFor(c.planet, c.day, c.month, c.year);
      near(r.longitude, c.lon, 1, `${c.label} długość`);
      assert.equal(r.zodiac, c.sign);
    });
  }
});

// --- Gotowe, gdy: K3 odległość planet dla dat referencyjnych mieści się w 2 procentach. ---
describe("K3: odległość", () => {
  const cases = [
    { planet: "mars", label: "Mars 27.08.2003", day: 27, month: 8, year: 2003, au: 0.3727 },
    { planet: "jowisz", label: "Jowisz 24.11.2026", day: 24, month: 11, year: 2026, au: 5.134 },
    { planet: "saturn", label: "Saturn 24.05.1543", day: 24, month: 5, year: 1543, au: 9.067 },
  ];

  for (const c of cases) {
    it(`${c.label}: ${c.au} au w granicach 2 procent`, () => {
      const r = resultFor(c.planet, c.day, c.month, c.year);
      near(r.distanceAu, c.au, c.au * 0.02, `${c.label} odległość`);
    });
  }
});

// --- Gotowe, gdy: K4 czas światła dla dat referencyjnych mieści się w 2 procentach. ---
describe("K4: czas światła", () => {
  it("Mars 27.08.2003: około 3.1 minuty", () => {
    const r = resultFor("mars", 27, 8, 2003);
    near(r.lightTimeMin, 3.1, 3.1 * 0.02, "Mars czas światła");
  });

  it("Saturn 24.05.1543: około 75.4 minuty", () => {
    const r = resultFor("saturn", 24, 5, 1543);
    near(r.lightTimeMin, 75.4, 75.4 * 0.02, "Saturn czas światła");
  });
});

// --- Gotowe, gdy: K5 ruch wsteczny zgodny z datami referencyjnymi. ---
describe("K5: ruch wsteczny", () => {
  const cases = [
    { planet: "mars", label: "Mars 27.08.2003", day: 27, month: 8, year: 2003, retro: true },
    { planet: "saturn", label: "Saturn 24.05.1543", day: 24, month: 5, year: 1543, retro: true },
    { planet: "jowisz", label: "Jowisz 24.11.2026", day: 24, month: 11, year: 2026, retro: false },
    { planet: "merkury", label: "Merkury 24.11.2026", day: 24, month: 11, year: 2026, retro: false },
    { planet: "wenus", label: "Wenus 1.01.2026", day: 1, month: 1, year: 2026, retro: false },
  ];

  for (const c of cases) {
    it(`${c.label}: ${c.retro ? "tak" : "nie"}`, () => {
      const r = resultFor(c.planet, c.day, c.month, c.year);
      assert.equal(r.retrograde, c.retro, `${c.label} ruch wsteczny`);
    });
  }
});

// --- Gotowe, gdy: K6 model kołowy Kopernika dla dat referencyjnych mieści się w podanych granicach. ---
describe("K6: model kołowy", () => {
  it("Mars 27.08.2003: około 333.1 stopnia i 0.524 au", () => {
    const r = resultFor("mars", 27, 8, 2003);
    near(r.modelLongitude, 333.1, 0.3, "Mars model długość");
    near(r.modelDistanceAu, 0.524, 0.01, "Mars model odległość");
  });

  it("Saturn 24.05.1543: około 220.7 stopnia", () => {
    const r = resultFor("saturn", 24, 5, 1543);
    near(r.modelLongitude, 220.7, 0.3, "Saturn model długość");
  });
});

// --- Gotowe, gdy: K7 kalendarz juliański przed 15.10.1582, gregoriański od tego dnia, dni 5-14.10.1582 odrzucone z czytelnym komunikatem, lata 1500-2100. ---
describe("K7: kalendarz i zakres dat", () => {
  it("przyjmuje datę juliańską przed przełączeniem", () => {
    const r = resultFor("saturn", 24, 5, 1543);
    assert.equal(r.calendar, "juliański");
    assert.equal(julianDay(1543, 5, 24), 2284781.5);
  });

  it("przyjmuje datę gregoriańską od 15.10.1582", () => {
    assert.equal(julianDay(1582, 10, 15), 2299160.5);
    assert.equal(calendarName(1582, 10, 15), "gregoriański");
  });

  it("odrzuca dni 5-14.10.1582 z czytelnym komunikatem", () => {
    assert.equal(julianDay(1582, 10, 5), null);
    assert.equal(julianDay(1582, 10, 14), null);
    assert.throws(
      () => resultFor("mars", 10, 10, 1582),
      (err) => err instanceof TypeError && /pominięto/.test(err.message)
    );
  });

  it("odrzuca rok poza zakresem 1500-2100", () => {
    assert.throws(
      () => resultFor("mars", 1, 1, 1499),
      (err) => err instanceof TypeError && /1500 do 2100/.test(err.message)
    );
    assert.throws(
      () => resultFor("mars", 1, 1, 2101),
      (err) => err instanceof TypeError && /1500 do 2100/.test(err.message)
    );
  });

  it("odrzuca niepełną lub nieistniejącą datę", () => {
    assert.throws(
      () => resultFor("mars", NaN, 1, 2026),
      (err) => err instanceof TypeError && /pełną datę/.test(err.message)
    );
    assert.throws(
      () => resultFor("mars", 31, 2, 2026),
      (err) => err instanceof TypeError && /nie ma/.test(err.message)
    );
  });
});

// --- Gotowe, gdy: K8 precesja liczona wzorem p(T) = 1.397*T + 0.00031*T*T. ---
describe("K8: precesja", () => {
  it("liczy p(T) = 1.397*T + 0.00031*T*T", () => {
    near(precession(0), 0, 1e-12, "precesja w J2000");
    near(precession(1), 1.39731, 1e-9, "precesja po jednym stuleciu");
    const T = (julianDay(2003, 8, 27) - 2451545.0) / 36525;
    near(precession(T), 1.397 * T + 0.00031 * T * T, 1e-9, "precesja dla daty Marsa");
  });

  it("utrzymuje długość w zakresie 0-360 stopni", () => {
    for (const v of [normalize360(-10), normalize360(370), normalize360(0)]) {
      assert.ok(v >= 0 && v < 360);
    }
  });
});
