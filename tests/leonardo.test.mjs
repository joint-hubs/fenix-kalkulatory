import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluate,
  liftKg,
  neededSpeedKmh,
  formatNumber,
  verdictSpeech,
  horsePace,
  wingspanPx,
  RHO,
  CL,
  G,
  STANDSTILL_MESSAGE,
  INVALID_MESSAGE,
} from "../public/leonardo/calc.js";

const pageHtml = readFileSync(new URL("../public/leonardo/index.html", import.meta.url), "utf8");
const pageCss = readFileSync(new URL("../public/leonardo/style.css", import.meta.url), "utf8");

function near(actual, expected, tolerance) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  );
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function cssVar(name) {
  const m = pageCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `zmienna --${name} jest w arkuszu`);
  return m[1];
}

// --- Gotowe, gdy: wpisuję masę lotnika razem z machiną, powierzchnię skrzydeł i prędkość, a dostaję odpowiedź „leci” albo „nie leci” ---

test("wpisuję masę, powierzchnię skrzydeł i prędkość, a dostaję leci albo nie leci", () => {
  const slow = evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 });
  assert.equal(slow.ok, true);
  assert.equal(slow.verdict, "nie leci");
  assert.equal(slow.flies, false);

  const fast = evaluate({ massKg: 90, areaM2: 10, speedKmh: 60 });
  assert.equal(fast.ok, true);
  assert.equal(fast.verdict, "leci");
  assert.equal(fast.flies, true);

  const borderline = evaluate({ massKg: 90, areaM2: 10, speedKmh: 39.5 });
  assert.equal(borderline.verdict, "leci", "prędkość potrzebna do lotu już niesie");
});

test("formularz zbiera masę, powierzchnię i prędkość", () => {
  assert.match(pageHtml, /<form/i, "formularz: Enter liczy tak jak przycisk");
  assert.match(pageHtml, /<input[^>]*id="masa"/, "pole na masę lotnika z machiną");
  assert.match(pageHtml, /<input[^>]*id="pole"/, "pole na powierzchnię skrzydeł");
  assert.match(pageHtml, /<input[^>]*id="predkosc"/, "pole na prędkość");
  assert.match(pageHtml, /id="werdykt"/, "miejsce na werdykt głosem Leonarda");
});

// --- Gotowe, gdy: dla 90 kg, 10 m² i 20 km/h machina nie leci, a strona mówi, jaka prędkość byłaby potrzebna (około 40 km/h) ---

test("dla 90 kg, 10 m² i 20 km/h machina nie leci i podaje potrzebną prędkość około 40 km/h", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 });
  assert.equal(result.ok, true);
  assert.equal(result.verdict, "nie leci");
  near(result.neededSpeedKmh, 39.5, 0.5); // około 40 km/h
  near(result.neededSpeedKmh, 39.46, 0.05); // kontrola ze zgłoszenia
  assert.match(result.speech, /około 40 km\/h/, "strona mówi o potrzebnej prędkości");
});

// --- Gotowe, gdy: widzę, ile kilogramów unoszą skrzydła i ile jeszcze brakuje ---

test("widzę, ile kilogramów unoszą skrzydła i ile jeszcze brakuje", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 });
  near(result.liftedKg, 23, 0.5); // około 23 kg uniesione
  near(result.missingKg, 67, 1); // 90 kg minus 23 kg
  assert.equal(formatNumber(Math.round(result.liftedKg)), "23");
  assert.equal(formatNumber(Math.round(result.missingKg)), "67");
  assert.match(result.speech, /uniosą 23 kg z 90/, "ile unoszą skrzydła");
  assert.match(result.speech, /brakuje 67 kg/, "ile jeszcze brakuje");
});

// --- Gotowe, gdy: przy prędkości zero strona się nie psuje, tylko spokojnie mówi, że na postoju nikt nie lata ---

test("przy prędkości zero strona się nie psuje i mówi, że na postoju nikt nie lata", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.verdict, "nie leci");
  assert.equal(result.standstill, true);
  assert.equal(result.message, STANDSTILL_MESSAGE);
  assert.equal(result.speech, STANDSTILL_MESSAGE, "przy postoju zostaje zdanie o postoju");
  assert.match(STANDSTILL_MESSAGE, /postoju/i, "komunikat mówi o postoju");
  assert.equal(result.liftedKg, 0);
  assert.ok(Number.isFinite(result.missingKg), "brakujące kilogramy są liczbą");
  assert.ok(Number.isFinite(result.neededSpeedKmh), "potrzebna prędkość jest liczbą");
  assert.doesNotThrow(() => evaluate({ massKg: 90, areaM2: 10, speedKmh: 0 }), "bez wyjątku w twarz");
});

test("prędkość zero nie zwraca NaN ani Infinity", () => {
  assert.equal(liftKg(90, 10, 0), 0);
  assert.ok(Number.isFinite(neededSpeedKmh(90, 10)));
});

test("błędne dane wracają z czytelnym komunikatem", () => {
  const negativeMass = evaluate({ massKg: -1, areaM2: 10, speedKmh: 20 });
  assert.equal(negativeMass.ok, false);
  assert.equal(negativeMass.error, INVALID_MESSAGE);
  assert.equal(negativeMass.speech, INVALID_MESSAGE);
  assert.equal(evaluate({ massKg: 90, areaM2: 0, speedKmh: 20 }).ok, false);
  assert.equal(evaluate({ massKg: 90, areaM2: 10, speedKmh: -5 }).ok, false);
  assert.equal(evaluate({ massKg: "90", areaM2: "10", speedKmh: "20" }).ok, true, "liczby z formularza też wchodzą");
  assert.equal(evaluate({ massKg: "10,5", areaM2: "2", speedKmh: "0" }).standstill, true, "przecinek dziesiętny z klawiatury");
});

// --- Wynik głosem Leonarda ---

test("głos Leonarda dla 90 kg, 10 m² i 20 km/h", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 });
  assert.equal(
    result.speech,
    "Nie wzleci. Skrzydła uniosą 23 kg z 90, brakuje 67 kg. Potrzeba około 40 km/h, tyle co koń w cwale.",
  );
  assert.equal(verdictSpeech(result), result.speech, "verdictSpeech zgadza się z evaluate");
});

test("głos Leonarda, gdy wzleci: skrzydła unoszą i jest zapas", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 60 });
  assert.equal(result.flies, true);
  assert.equal(result.speech, "Wzleci! Skrzydła uniosą 208 kg, zapas 118 kg.");
});

test("głos Leonarda przy postoju zostawia zdanie o postoju", () => {
  const result = evaluate({ massKg: 90, areaM2: 10, speedKmh: 0 });
  assert.equal(result.speech, "Na postoju nikt nie lata. Podaj prędkość większą od zera.");
});

// --- Porównanie z koniem: stęp około 6, kłus około 15, cwał około 45 km/h ---

test("progi konia: najbliższy z sześciu, piętnastu i czterdziestu pięciu", () => {
  assert.equal(horsePace(6).name, "stęp");
  assert.equal(horsePace(15).name, "kłus");
  assert.equal(horsePace(45).name, "cwał");
  assert.equal(horsePace(8).name, "stęp", "8 bliżej sześciu");
  assert.equal(horsePace(20).name, "kłus", "20 bliżej piętnastu");
  assert.equal(horsePace(39.46).name, "cwał", "potrzebne 40 km/h to cwał");
  assert.equal(horsePace(39.46).locative, "cwale", "w cwale w zdaniu");
  assert.equal(horsePace(6).locative, "stępie");
  assert.equal(horsePace(15).locative, "kłusie");
});

test("głos podaje porównanie z koniem przy potrzebnej prędkości", () => {
  const tiny = evaluate({ massKg: 20, areaM2: 20, speedKmh: 5 });
  assert.equal(tiny.flies, false);
  assert.match(tiny.speech, /tyle co koń w (stępie|kłusie|cwale)\./);
});

// --- Szkic machiny w inline SVG ---

test("szkic machiny jest w inline SVG i reaguje na werdykt", () => {
  assert.match(pageHtml, /<svg[^>]*id="szkic"/, "szkic jest w treści strony, nie z pliku");
  assert.match(pageHtml, /id="machina"/, "machina jest w szkicu");
  assert.match(pageHtml, /id="skrzydla"/, "skrzydła da się rozpiąć");
  assert.match(pageCss, /#szkic\.leci/, "machina unosi się, gdy leci");
});

test("szkic ma skrzydła nietoperza: żebra i błonę, a pośrodku ramę z lotnikiem", () => {
  const zebra = pageHtml.match(/class="zebro"/g) ?? [];
  const blony = pageHtml.match(/class="blona"/g) ?? [];
  assert.ok(zebra.length >= 8, `co najmniej cztery żebra na skrzydło, jest ${zebra.length}`);
  assert.equal(blony.length, 2, "błona na każde ze skrzydeł");
  assert.match(pageHtml, /class="rama"/, "drewniana rama pośrodku");
  assert.match(pageHtml, /class="lotnik"/, "lotnik leży pod ramą");
  assert.match(pageCss, /\.blona[^}]*fill:/, "błona wypełniona ciemniejszym papierem");
});

test("rozpiętość skrzydeł rośnie z powierzchnią", () => {
  assert.ok(wingspanPx(1) < wingspanPx(10), "większe skrzydła dla większej powierzchni");
  assert.ok(wingspanPx(10) < wingspanPx(100), "i jeszcze większej jeszcze większe");
  assert.ok(wingspanPx(100) <= 220, "rozpiętość mieści się w szkicu");
  assert.ok(wingspanPx(0.5) >= 40, "małe skrzydła nie znikają");
});

test("ruch tylko bez preferencji ograniczonego ruchu", () => {
  assert.match(pageCss, /prefers-reduced-motion:\s*no-preference/, "animacja jest za zgodą na ruch");
  assert.match(
    pageCss,
    /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?(?:animation|@keyframes)/,
    "klucz animacji siedzi w bloku no-preference",
  );
});

// --- Kartka z notatnika: sepia, brązowy atrament, odręczne nagłówki ---

test("kartka z notatnika: kremowy papier i brązowy atrament", () => {
  const papier = cssVar("papier");
  const atrament = cssVar("atrament");
  const mgla = cssVar("atrament-mgla");
  const jasny = cssVar("papier-jasny");
  assert.ok(contrast(papier, atrament) >= 4.5, `atrament na papierze kontrast ${contrast(papier, atrament)}`);
  assert.ok(contrast(papier, mgla) >= 4.5, `mgła na papierze kontrast ${contrast(papier, mgla)}`);
  assert.ok(contrast(jasny, atrament) >= 4.5, `atrament na jaśniejszym polu kontrast ${contrast(jasny, atrament)}`);
});

test("nagłówki odręcznym pismem, tekst szeryfowy", () => {
  assert.match(pageCss, /'Segoe Print'/, "odręczny krój systemowy");
  assert.match(pageCss, /'Bradley Hand'/, "drugi odręczny krój zapasowy");
  assert.match(pageCss, /cursive/, "zapis odręczny jako ostateczność");
  assert.match(pageCss, /Georgia|'Times New Roman'|serif/, "tekst szeryfowy");
});

test("tytuł Machina latająca jest lustrzany i czytelny dla czytników ekranu", () => {
  assert.match(pageHtml, /Machina latająca/, "tytuł na stronie");
  assert.match(pageHtml, /aria-label="Machina latająca"/, "czytniki ekranu czytają normalnie");
  assert.match(pageCss, /scaleX\(-1\)/, "odbicie lustrzane tytułu");
  assert.match(pageHtml, /Pisane od prawej, jak u mistrza\./, "podpis pod tytułem zwykłym pismem");
  assert.match(pageHtml, /Zgłasza: Leonardo da Vinci \(1452-1519\)/, "autor pod tytułem");
});

test("bez czcionek i plików z sieci", () => {
  assert.doesNotMatch(pageCss, /@import|url\(|https?:\/\//, "arkusz bez zasobów z sieci");
  assert.doesNotMatch(pageHtml, /https?:\/\//, "strona bez zasobów z sieci");
});

// --- Założenia drobnym drukiem (stałe ze zgłoszenia) ---

test("stałe są zgodne ze zgłoszeniem i pokazane drobnym drukiem", () => {
  assert.equal(RHO, 1.225);
  assert.equal(CL, 1.2);
  assert.equal(G, 9.81);
  assert.match(pageHtml, /1[.,]225/, "gęstość powietrza w założeniach");
  assert.match(pageHtml, /\bCL\b/, "współczynnik wznoszenia w założeniach");
  assert.match(pageHtml, /9[.,]81/, "przyspieszenie ziemskie w założeniach");
  assert.match(pageHtml, /class="zalozenia"/, "założenia są w drobnym druku");
  assert.match(pageCss, /\.zalozenia/, "drobny druk ma własny styl");
});

// --- Działa z klawiatury i myszką ---

test("działa z klawiatury i myszką", () => {
  assert.match(pageHtml, /<button[^>]*type="submit"/, "przycisk liczy, tak jak Enter");
  assert.match(pageHtml, /<button/i, "przycisk do klikania myszką");
  assert.doesNotMatch(pageHtml, /<input[^>]*\breadonly\b/i, "pola muszą być edytowalne");
  assert.doesNotMatch(pageHtml, /<input[^>]*\bdisabled\b/i, "pola muszą być edytowalne");
  assert.doesNotMatch(pageHtml, /<button[^>]*\bdisabled\b/i, "przyciski muszą być aktywne");
  assert.match(pageHtml, /aria-live=/, "zmiana wyniku jest ogłaszana");
  assert.match(pageHtml, /type="module"/, "strona używa logiki z calc.js");
});

// --- Wygląda dobrze na telefonie 390 px ---

test("wygląda dobrze na telefonie", () => {
  assert.match(pageHtml, /<meta[^>]*name="viewport"[^>]*width=device-width/, "viewport dla telefonów");
  assert.match(pageCss, /@media/, "style łapie wąskie ekrany");
  assert.match(pageCss, /max-width/, "układ nie wychodzi poza ekran");
  assert.match(pageCss, /#szkic[^}]*width:\s*100%|#szkic\s*\{[^}]*width:\s*100%/, "szkic skaluje się do ekranu");
});

// --- Kopia po polsku, bez pauz ---

test("kopia jest po polsku i bez pauz en i em", () => {
  assert.match(pageHtml, /<html lang="pl"/);
  assert.doesNotMatch(pageHtml, /[–—]/, "bez pauz en i em w tekście strony");
  assert.doesNotMatch(STANDSTILL_MESSAGE, /[–—]/);
  assert.doesNotMatch(INVALID_MESSAGE, /[–—]/);
  const mówione = [
    evaluate({ massKg: 90, areaM2: 10, speedKmh: 20 }).speech,
    evaluate({ massKg: 90, areaM2: 10, speedKmh: 60 }).speech,
    evaluate({ massKg: 90, areaM2: 10, speedKmh: 0 }).speech,
  ];
  for (const zdanie of mówione) assert.doesNotMatch(zdanie, /[–—]/, "bez pauz en i em w głosie Leonarda");
});

// --- Link z listy kalkulatorów ---

test("lista kalkulatorów linkuje do zgłoszenia Leonarda", () => {
  const listHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(listHtml, /href="leonardo\/"/);
});
