import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  resultFor,
  julianDay,
  calendarName,
  precession,
  normalize360,
  signPosition,
  formatMlnKm,
} from "../public/kopernik/calc.js";
import { initKopernik } from "../public/kopernik/app.js";

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

// --- Gotowe, gdy: K10 każda zmiana danych (planeta, dzień, miesiąc, rok) i przycisk „Policz" zawsze dają wynik dla aktualnych danych. ---
// --- Gotowe, gdy: K12 testy sprawdzają stronę: testy prowadzą dokładnie ten kod, który uruchamia przeglądarka (moduł app.js, nie kopia). ---

// Minimalna atrapa elementu DOM o interfejsie, którego używa app.js: wartości,
// valueAsNumber jak w przeglądarce, zbieranie listenerów i klas, dispatchEvent.
function stubElement(tag) {
  return {
    tagName: tag,
    children: [],
    listeners: {},
    value: "",
    textContent: "",
    innerHTML: "",
    classList: {
      classes: new Set(),
      add(name) { this.classes.add(name); },
      remove(name) { this.classes.delete(name); },
      contains(name) { return this.classes.has(name); },
    },
    appendChild(child) {
      this.children.push(child);
      if (tag === "select" && this.value === "") this.value = child.value;
    },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] ?? null; },
    removeAttribute(k) { delete this.attrs[k]; },
    hidden: false,
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    dispatch(type, event = { preventDefault() {} }) {
      for (const fn of this.listeners[type] || []) fn(event);
    },
    get valueAsNumber() {
      if (this.value === "" || this.value == null) return NaN;
      return Number(this.value);
    },
  };
}

// Buduje stronę dokładnie tak, jak robi to przeglądarka: initKopernik wypełnia
// listę planet, podpina listeners i liczy wynik startowy dla danych z pól.
function buildPage() {
  const planeta = stubElement("select");
  const dzien = stubElement("input");
  const miesiac = stubElement("input");
  const rok = stubElement("input");
  const wynik = stubElement("section");
  const form = stubElement("form");
  const szczegoly = stubElement("details");
  const bladDzien = stubElement("p");
  const bladMiesiac = stubElement("p");
  const bladRok = stubElement("p");
  dzien.value = "27";
  miesiac.value = "8";
  rok.value = "2003";
  initKopernik({
    planeta, dzien, miesiac, rok, wynik, form, szczegoly,
    bladDzien, bladMiesiac, bladRok,
    createElement: (tag) => stubElement(tag),
  });
  return { planeta, dzien, miesiac, rok, wynik, form, szczegoly, bladDzien, bladMiesiac, bladRok };
}

describe("K10/K12: strona przelicza wynik dla aktualnych danych", () => {
  it("start: app.js wypełnia listę planet i liczy wynik dla pól startowych", () => {
    const page = buildPage();
    assert.equal(page.planeta.children.length, 5);
    // K18: data startowa to wielkie zbliżenie Marsa 27.08.2003, więc planeta
    // przy otwarciu strony pasuje do daty, zamiast zostać przy pierwszej.
    assert.equal(page.planeta.value, "mars");
    assert.match(page.wynik.innerHTML, /Mars/);
    assert.match(page.wynik.innerHTML, /27 sierpnia 2003 roku/);
  });

  it("zmiana planety od razu przelicza wynik (test, który dziś by nie przeszedł)", () => {
    const page = buildPage();
    page.planeta.value = "jowisz";
    page.planeta.dispatch("change");
    assert.match(page.wynik.innerHTML, /Jowisz/);
    assert.doesNotMatch(page.wynik.innerHTML, /Merkury/);
  });

  it("Policz po wyborze innej planety daje wynik tej planety (odtworzenie zgłoszenia właściciela)", () => {
    const page = buildPage();
    page.planeta.value = "jowisz";
    page.form.dispatch("submit");
    assert.match(page.wynik.innerHTML, /Jowisz/);
    assert.doesNotMatch(page.wynik.innerHTML, /Merkury/);
  });

  it("zmiana dnia, miesiąca i roku przelicza wynik przy następnych danych", () => {
    const page = buildPage();
    page.planeta.value = "saturn";
    page.planeta.dispatch("change");
    page.dzien.value = "24";
    page.dzien.dispatch("input");
    page.miesiac.value = "5";
    page.miesiac.dispatch("input");
    page.rok.value = "1543";
    page.rok.dispatch("input");
    assert.match(page.wynik.innerHTML, /24 maja 1543 roku/);
    assert.match(page.wynik.innerHTML, /juliański/);
  });

  it("wynik zawsze pokazuje nazwę planety, dla której został policzony", () => {
    const page = buildPage();
    for (const [id, name] of [["wenus", "Wenus"], ["saturn", "Saturn"]]) {
      page.planeta.value = id;
      page.planeta.dispatch("change");
      assert.match(page.wynik.innerHTML, new RegExp(`Wynik dla planety ${name}`));
    }
  });

  it("błędna data pokazuje komunikat i klasę blad, poprawna data ją zdejmuje", () => {
    const page = buildPage();
    page.dzien.value = "31";
    page.dzien.dispatch("input");
    page.miesiac.value = "2";
    page.miesiac.dispatch("input");
    assert.equal(page.wynik.classList.contains("blad"), true);
    page.miesiac.value = "3";
    page.miesiac.dispatch("input");
    assert.equal(page.wynik.classList.contains("blad"), false);
  });
});

// --- Gotowe, gdy: K11 kalkulator zrozumiały dla laika: prosty wstęp, objaśnienie przy każdym wyniku, jedno zdanie o różnicy modeli. ---
describe("K11: objaśnienia dla laika", () => {
  const appJs = readFileSync(
    new URL("../public/kopernik/app.js", import.meta.url),
    "utf8"
  );

  it("wynik pokazuje krótkie objaśnienie przy każdej etykiecie", () => {
    const page = buildPage();
    const etykiety = [
      "Znak zodiaku",
      "Ekliptyczna długość",
      "Odległość",
      "Czas światła",
      "Ruch wsteczny",
      "Model kół Kopernika",
      "Kalendarz",
    ];
    for (const etykieta of etykiety) {
      const wzor = new RegExp(`<dt title="[^"]*">${etykieta}</dt>`);
      assert.match(page.wynik.innerHTML, wzor, `objaśnienie przy etykiecie: ${etykieta}`);
    }
  });

  it("sekcja Co znaczą te wyniki? wyjaśnia każdy wynik po polsku", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /Co znaczą te wyniki\?/);
    for (const slowo of ["zodiaku", "odległość", "światło", "cofa", "kołach", "kalendarz"]) {
      assert.match(page.wynik.innerHTML, new RegExp(slowo, "i"));
    }
  });

  it("przy modelu kół jest jedno zdanie, co oznacza różnica", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /Różnica pokazuje, o ile/);
    assert.match(page.wynik.innerHTML, /kołach Kopernika/);
  });

  it("wstęp na stronie mówi prosto, co liczy i jak go użyć", () => {
    const copy = pageHtml.replace(/<[^>]+>/g, " ");
    assert.match(copy, /Wybierz planetę z listy/);
    assert.match(copy, /wynik przeliczy się sam/);
  });

  it("kopie strony i modułu są na ty i bez półpauz", () => {
    for (const zrodlo of [pageHtml, appJs]) {
      const copy = zrodlo.replace(/<[^>]+>/g, " ");
      assert.doesNotMatch(copy, /[–—]/);
    }
    assert.match(pageHtml, /Podaj mi planetę/);
  });
});

// --- Gotowe, gdy: K11 komunikat o błędzie pasuje do tego, co wpisano (nie każdy błąd to wykład o 1582 roku). ---
describe("K11: komunikaty o złych datach", () => {
  it("nieistniejący dzień, np. 32 marca 2003, nie dostaje wykładu o 1582 roku", () => {
    assert.throws(
      () => resultFor("mars", 32, 3, 2003),
      (err) =>
        err instanceof TypeError &&
        /nie ma/.test(err.message) &&
        !/1582/.test(err.message)
    );
  });

  it("dni 5 do 14 października 1582 dostają wyjaśnienie reformy kalendarza", () => {
    assert.throws(
      () => resultFor("mars", 10, 10, 1582),
      (err) => err instanceof TypeError && /pominięto/.test(err.message)
    );
  });

  it("zły miesiąc też dostaje komunikat o nieistniejącym dniu", () => {
    assert.throws(
      () => resultFor("mars", 1, 13, 2003),
      (err) => err instanceof TypeError && /nie ma/.test(err.message)
    );
  });
});

// --- Gotowe, gdy: K14 nad liczbami jest jedno zdanie z wynikiem: planeta, znak, kierunek ruchu. ---
describe("K14: zdanie z wynikiem nad liczbami", () => {
  it("Mars 27.08.2003: zdanie zawiera Mars, Ryb i cofa", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /Wynik dla planety Mars/);
    assert.match(page.wynik.innerHTML, /Mars stoi w Rybach/);
    assert.match(page.wynik.innerHTML, /cofa się na tle gwiazd/);
  });

  it("Jowisz 24.11.2026: zdanie mówi o ruchu do przodu", () => {
    const page = buildPage();
    page.planeta.value = "jowisz";
    page.dzien.value = "24";
    page.miesiac.value = "11";
    page.rok.value = "2026";
    page.rok.dispatch("input");
    assert.match(page.wynik.innerHTML, /Jowisz stoi w Lwie/);
    assert.match(page.wynik.innerHTML, /idzie po niebie do przodu/);
  });
});

// --- Gotowe, gdy: K15 bez fałszywej precyzji: km jako mln km (max 3 cyfry znaczące), położenie w znaku słowami, pełne stopnie tylko jako szczegół. ---
describe("K15: czytelne liczby", () => {
  it("odległość Marsa 27.08.2003 jako mln km, bez 7 cyfr z rzędu", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /55,8 mln km/);
    assert.doesNotMatch(page.wynik.innerHTML, /\d{7}/);
  });

  it("położenie w znaku słowami, pełne stopnie tylko jako szczegół", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /5° po początku Ryb/);
    assert.match(page.wynik.innerHTML, /dokładnie 335,27°/);
    assert.match(page.wynik.innerHTML, /szczegol/);
  });

  it("formatMlnKm daje najwyżej 3 cyfry znaczące", () => {
    assert.equal(formatMlnKm(55732590), "55,7 mln km");
    assert.equal(formatMlnKm(768412345), "768 mln km");
    assert.equal(formatMlnKm(1356500000), "1,36 mld km");
  });

  it("signPosition mówi słowami, gdzie w znaku stoi planeta", () => {
    assert.equal(signPosition(335.27).text, "5° po początku Ryb");
    assert.equal(signPosition(355.2).text, "5° przed końcem Ryb");
    assert.equal(signPosition(0.2).text, "dokładnie na początku Barana");
    assert.equal(signPosition(119.9).text, "dokładnie na końcu Raka");
  });
});

// --- Gotowe, gdy: K16 czas światła z porównaniem: światło ze Słońca leci około 8 minut. ---
describe("K16: czas światła z porównaniem", () => {
  it("Mars 27.08.2003: czas światła przywołuje 8 minut światła ze Słońca", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /Czas światła/);
    assert.match(page.wynik.innerHTML, /około 8 minut/);
  });
});

// --- Gotowe, gdy: K17 przycisk ? przy pojęciach, obsługiwany klawiaturą i dotykiem, tekst o bieżącej planecie i dacie; nie tylko title. ---
describe("K17: pomoc pod znakiem zapytania", () => {
  function fakePomoc(key) {
    const btn = {
      attrs: { "data-pomoc": key, "aria-expanded": "false" },
      closest(sel) { return sel === "[data-pomoc]" ? btn : null; },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k] ?? null; },
    };
    return btn;
  }

  it("przy j.a., długości ekliptycznej, ruchu wstecznym i kołach Kopernika jest przycisk ?", () => {
    const page = buildPage();
    for (const key of ["odleglosc", "dlugosc", "wstecz", "model"]) {
      assert.match(
        page.wynik.innerHTML,
        new RegExp(`data-pomoc="${key}"`),
        `brak pomocy dla ${key}`
      );
    }
  });

  it("klik na ? pokazuje objaśnienie o bieżącej planecie i dacie, drugi klik chowa", () => {
    const page = buildPage();
    page.wynik.dispatch("click", { target: fakePomoc("odleglosc") });
    assert.match(page.wynik.innerHTML, /data-pomoc="odleglosc"[^>]*aria-expanded="true"/);
    assert.match(page.wynik.innerHTML, /Mars, 27 sierpnia 2003 roku/);
    page.wynik.dispatch("click", { target: fakePomoc("odleglosc") });
    assert.match(page.wynik.innerHTML, /data-pomoc="odleglosc"[^>]*aria-expanded="false"/);
    assert.match(page.wynik.innerHTML, /id="panel-pomoc" class="panel-pomoc" hidden/);
  });

  it("klik na inny ? podmienia treść", () => {
    const page = buildPage();
    page.wynik.dispatch("click", { target: fakePomoc("odleglosc") });
    page.wynik.dispatch("click", { target: fakePomoc("model") });
    assert.match(page.wynik.innerHTML, /data-pomoc="model"[^>]*aria-expanded="true"/);
    assert.match(page.wynik.innerHTML, /data-pomoc="odleglosc"[^>]*aria-expanded="false"/);
    assert.match(page.wynik.innerHTML, /Tu koła dają/);
  });
});

// --- Gotowe, gdy: K19 koła Kopernika jednym zdaniem jego głosem: stopnie, procent, dalej lub bliżej, bez minusa. ---
describe("K19: koła Kopernika jednym zdaniem", () => {
  it("Mars 27.08.2003: około 40 procent dalej, bez minusa", () => {
    const page = buildPage();
    assert.match(page.wynik.innerHTML, /333,06° zamiast 335,27°/);
    assert.match(page.wynik.innerHTML, /około 40% dalej/);
    const copy = page.wynik.innerHTML.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(copy, /-\s?\d/);
  });
});

// --- Gotowe, gdy: K22 każdy widoczny przycisk coś zmienia; bez zdań o obsłudze w rodzaju „Policz powtarza obliczenie". ---
describe("K22: bez zdań o obsłudze", () => {
  it("wstęp nie opowiada, co robi przycisk", () => {
    const copy = pageHtml.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(copy, /powtarza obliczenie/);
    assert.doesNotMatch(copy, /Przycisk/);
  });
});

// --- Gotowe, gdy: K20 zła data nie kasuje wyniku: poprzedni przygaszony, komunikat przy złym polu, aria-invalid i aria-describedby. ---
describe("K20: zła data nie kasuje wyniku", () => {
  it("31.02: wynik zostaje przygaszony, komunikat przy polu, atrybuty a11y", () => {
    const page = buildPage();
    page.dzien.value = "31";
    page.miesiac.value = "2";
    page.miesiac.dispatch("input");
    assert.match(page.wynik.innerHTML, /27 sierpnia 2003 roku/);
    assert.equal(page.wynik.classList.contains("przygaszony"), true);
    assert.equal(page.dzien.getAttribute("aria-invalid"), "true");
    assert.equal(page.dzien.getAttribute("aria-describedby"), "blad-dzien");
    assert.equal(page.bladDzien.hidden, false);
    assert.match(page.bladDzien.textContent, /nie ma/);
  });

  it("rok poza zakresem wskazuje pole roku", () => {
    const page = buildPage();
    page.rok.value = "1499";
    page.rok.dispatch("input");
    assert.equal(page.rok.getAttribute("aria-invalid"), "true");
    assert.equal(page.bladRok.hidden, false);
    assert.equal(page.bladDzien.hidden, true);
  });

  it("poprawa daty zdejmuje przygaszenie, komunikat i atrybuty", () => {
    const page = buildPage();
    page.dzien.value = "31";
    page.miesiac.value = "2";
    page.miesiac.dispatch("input");
    page.miesiac.value = "3";
    page.miesiac.dispatch("input");
    assert.equal(page.wynik.classList.contains("przygaszony"), false);
    assert.equal(page.dzien.getAttribute("aria-invalid"), null);
    assert.equal(page.dzien.getAttribute("aria-describedby"), null);
    assert.equal(page.bladDzien.hidden, true);
    assert.match(page.wynik.innerHTML, /31 marca 2003 roku/);
  });
});
