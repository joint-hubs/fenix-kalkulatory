import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  posteriorChance,
  resultFor,
  formatPercent,
  dotCounts,
  PERFECT_WITNESS_NOTE,
} from "../public/kartezjusz/calc.js";

const html = readFileSync(new URL("../public/kartezjusz/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/kartezjusz/style.css", import.meta.url), "utf8");
const landing = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

// Wzór z treści zadania: P = r*p / (r*p + (1-r)*(1-p)), p = 1/N, r = wiarygodnosc.
// Kontrola: N = 1000, r = 0,99 daje 0,0902.

test("1 na 1000 przy swiadku pewnym w 99 na 100 daje okolo 9 procent", () => {
  const chance = posteriorChance(1000, 99);
  assert.ok(Math.abs(chance - 0.0902) < 0.001, `oczekiwano ok. 0,0902, bylo ${chance}`);
  assert.equal(formatPercent(chance), "9%");
  assert.equal(resultFor(1000, 99).chanceText, "9%");
});

test("obok wyniku jest jedno zdanie, ktore tlumaczy niski wynik", () => {
  const { sentence } = resultFor(1000, 99);
  assert.equal(typeof sentence, "string");
  assert.ok(sentence.trim().length > 20, "zdanie nie moze byc puste");
  assert.match(sentence, /raz na 1000/);
  assert.match(sentence, /myli|pomyłk/);
  assert.ok(!/[—–]/.test(sentence), "bez polpauz i pauz");
});

test("swiadek nieomylny daje 100 procent i dopisek o braku takich swiadkow", () => {
  const result = resultFor(1000, 100);
  assert.equal(result.chance, 1);
  assert.equal(result.chanceText, "100%");
  assert.equal(result.perfectWitness, true);
  assert.match(result.note, /jeszcze nie spotkałem/);
  assert.match(PERFECT_WITNESS_NOTE, /jeszcze nie spotkałem/);
  // strona musi dopisek realnie skladac z wyniku modulu
  assert.match(html, /rachunek\.note/);
  assert.match(html, /id="dopisek"/);
});

test("absurdne dane odrzuca z jawnym bledem", () => {
  assert.throws(() => posteriorChance(0, 99), TypeError);
  assert.throws(() => posteriorChance(1000.5, 99), TypeError);
  assert.throws(() => posteriorChance(1000, 101), TypeError);
  assert.throws(() => posteriorChance(1000, -1), TypeError);
  assert.throws(() => posteriorChance(Number.NaN, 99), TypeError);
});

test("wykres liczy 1000 kropek, swieci zdarzenie i pomylki swiadka", () => {
  const dots = dotCounts(1000, 99);
  assert.equal(dots.total, 1000);
  assert.equal(dots.truth, 1);
  assert.equal(dots.errors, 10);
  assert.equal(dotCounts(1000, 100).errors, 0);
  assert.equal(dotCounts(1000, 0).errors, 999);
});

test("1 na 10 przy 90 procentach: zdanie liczy zgloszenia, nie zdarzenia, bez zaledwie", () => {
  const dots = dotCounts(10, 90);
  assert.equal(dots.truth, 90, "prawdziwe zgloszenia = 1000 * (1/10) * 0,9");
  assert.equal(dots.errors, 90);
  assert.equal(dots.claimed, 180);
  const { sentence } = resultFor(10, 90);
  assert.match(sentence, /Na ok\. 180 zgłoszeń/);
  assert.match(sentence, /przypada 90 prawdziwych/);
  assert.ok(!/zaledwie/.test(sentence), "przy dokladnie 50 procentach bez zaledwie");
});

test("1 na 1000 przy 99 procentach: zdanie liczy zgloszenia i mowi zaledwie", () => {
  const dots = dotCounts(1000, 99);
  assert.equal(dots.truth, 1);
  assert.equal(dots.errors, 10);
  assert.equal(dots.claimed, 11);
  const { sentence } = resultFor(1000, 99);
  assert.match(sentence, /Na ok\. 11 zgłoszeń/);
  assert.match(sentence, /przypada zaledwie 1 prawdziwe/);
});

test("zaledwie wraca, gdy wynik spada ponizej polowy", () => {
  const chance = posteriorChance(2, 40);
  assert.ok(chance < 0.5, `sanity: oczekiwano ponizej polowy, bylo ${chance}`);
  assert.match(resultFor(2, 40).sentence, /zaledwie/);
});

test("wykres jest inline SVG na ukladzie wspolrzednych z legenda", () => {
  assert.match(html, /<svg[^>]*id="mapa"/);
  assert.match(html, /viewBox="/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="[^"]+"/);
  assert.match(html, /zdarzyła się naprawdę/);
  assert.match(html, /świadek się pomylił|świadek pomylił się/);
});

test("strona wyglada jak traktat: papier, atrament, Georgia, bez czcionek z sieci", () => {
  assert.match(css, /Georgia/);
  assert.match(css, /serif/);
  assert.ok(!/url\(|@import|https?:/.test(css), "zadnych plikow z sieci w stylach");
  // doslowny namespace SVG to nie zasob z sieci; licza sie dopiero pobierane pliki
  assert.ok(!/url\(|@import|<(link|script|img)[^>]*(src|href)="https?:/.test(html), "zadnych zasobow z sieci na stronie");
  assert.match(html, /Zgłasza: Kartezjusz \(1596-1650\)/);
});

test("kontrast atramentu na papierze spelnia WCAG AA", () => {
  const luminance = (hex) => {
    const v = hex.replace("#", "");
    const parts = [0, 2, 4].map((i) => {
      const c = parseInt(v.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  };
  const contrast = (a, b) => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const papier = css.match(/--papier:\s*(#[0-9a-fA-F]{6})/)[1];
  const atrament = css.match(/--atrament:\s*(#[0-9a-fA-F]{6})/)[1];
  assert.ok(contrast(atrament, papier) >= 4.5, `kontrast ${atrament} na ${papier} < 4,5`);
});

test("strona miesci sie na telefonie 390 px bez poziomego przewijania", () => {
  assert.match(html, /width=device-width/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /max-width:/);
  // sztywna szerokosc (nie max-width/min-width) nie moze przekroczyc 390 px
  const rigidWidths = [...css.matchAll(/(^|[^-a-zA-Z])width:\s*(\d+(?:\.\d+)?)px/g)]
    .map((m) => Number(m[2]));
  assert.ok(
    rigidWidths.every((w) => w <= 390),
    `sztywna szerokosc > 390 px: ${rigidWidths.filter((w) => w > 390).join(", ")}`,
  );
});

test("mowa wlasna: copy po polsku, na ty, bez polpauz i pauz", () => {
  assert.equal(html.match(/lang="pl"/g).length, 1);
  assert.ok(!/[—–]/.test(html), "bez polpauz i pauz w stronie");
  assert.ok(!/[—–]/.test(css), "bez polpauz i pauz w stylach");
  const { sentence, note } = resultFor(1000, 99);
  assert.ok(!/[—–]/.test(sentence + note));
  assert.match(html, /Ty |twój|się/);
});

test("polka maja podpisy i strona dziala z klawiatury", () => {
  assert.match(html, /<label for="rzadkosc"/);
  assert.match(html, /<label for="wiarygodnosc"/);
  assert.match(html, /<input[^>]*id="rzadkosc"[^>]*type="number"/);
  assert.match(html, /<input[^>]*id="wiarygodnosc"[^>]*type="number"/);
  assert.match(html, /type="submit"/);
  assert.match(html, /aria-live="polite"/);
});

test("strona glowna ma link do zgloszenia Kartezjusza", () => {
  assert.match(landing, /<li><a href="kartezjusz\/">[^<]+<\/a><\/li>/);
});

test("ułamki formatuje sie po polsku, z przecinkiem", () => {
  assert.equal(formatPercent(0), "0%");
  assert.equal(formatPercent(1), "100%");
  assert.equal(formatPercent(0.0934), "9,3%");
  assert.equal(formatPercent(0.0004), "< 0,1%");
});
