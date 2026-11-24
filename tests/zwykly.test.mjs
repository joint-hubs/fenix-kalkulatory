import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluate,
  add,
  subtract,
  multiply,
  divide,
  formatNumber,
  removeLast,
  DIVIDE_BY_ZERO_MESSAGE,
} from "../public/zwykly/calc.js";

const pageHtml = readFileSync(new URL("../public/zwykly/index.html", import.meta.url), "utf8");
const pageCss = readFileSync(new URL("../public/zwykly/style.css", import.meta.url), "utf8");

// --- Gotowe, gdy: wpisuję 2 + 2 i widzę 4 ---

test("wpisuję 2 + 2 i widzę 4", () => {
  assert.deepEqual(evaluate("2 + 2"), { ok: true, value: 4 });
  assert.deepEqual(evaluate("2+2"), { ok: true, value: 4 });
  assert.equal(formatNumber(evaluate("2 + 2").value), "4");
});

test("dodawanie, odejmowanie, mnożenie i dzielenie liczą wynik", () => {
  assert.equal(add(2, 2), 4);
  assert.equal(subtract(5, 3), 2);
  assert.equal(multiply(3, 4), 12);
  assert.equal(divide(8, 2), 4);
  assert.deepEqual(evaluate("5 - 3"), { ok: true, value: 2 });
  assert.deepEqual(evaluate("3 * 4"), { ok: true, value: 12 });
  assert.deepEqual(evaluate("3 × 4"), { ok: true, value: 12 });
  assert.deepEqual(evaluate("8 / 2"), { ok: true, value: 4 });
  assert.deepEqual(evaluate("8 ÷ 2"), { ok: true, value: 4 });
});

test("wynik jest czytelny także po przecinku", () => {
  assert.equal(formatNumber(evaluate("0,1 + 0,2").value), "0,3");
  assert.equal(formatNumber(evaluate("2,5 × 2").value), "5");
});

// --- Gotowe, gdy: dzielenie przez zero pokazuje czytelny komunikat zamiast błędu ---

test("dzielenie przez zero pokazuje czytelny komunikat zamiast błędu", () => {
  const result = evaluate("4 / 0");
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, "string");
  assert.ok(result.error.length > 0, "komunikat nie może być pusty");
  assert.match(result.error, /zero/i, "komunikat mówi, o co chodzi");
  assert.equal(result.error, DIVIDE_BY_ZERO_MESSAGE);
  assert.equal(result.value, undefined);
  assert.doesNotThrow(() => evaluate("4 / 0"), "bez wyjątku w twarz");
  assert.deepEqual(evaluate("0 ÷ 0"), result);
});

test("dzielenie przez zero nie zwraca NaN ani Infinity", () => {
  assert.equal(divide(4, 0), null);
  assert.equal(divide(0, 0), null);
});

// --- Gotowe, gdy: działa z klawiatury i myszką ---

test("działa z klawiatury i myszką", () => {
  assert.match(pageHtml, /<form/i, "formularz: Enter w polu liczy działanie");
  assert.match(pageHtml, /<input[^>]*id="wyrazenie"/, "pole do wpisywania z klawiatury");
  assert.doesNotMatch(pageHtml, /<input[^>]*\breadonly\b/i, "pole musi być edytowalne");
  assert.doesNotMatch(pageHtml, /<input[^>]*\bdisabled\b/i, "pole musi być edytowalne");
  assert.match(pageHtml, /<button/i, "przyciski do klikania myszką");
  assert.doesNotMatch(pageHtml, /<button[^>]*\bdisabled\b/i, "przyciski muszą być aktywne");
  assert.match(pageHtml, /type="submit"/, "przycisk = liczy, tak jak Enter");
});

test("ekran wyniku jest gotowy na wynik i na komunikat", () => {
  assert.match(pageHtml, /id="wynik"/, "miejsce na wynik albo komunikat");
  assert.match(pageHtml, /aria-live=/, "zmiana wyniku jest ogłaszana");
  assert.match(pageHtml, /type="module"/, "strona używa logiki z calc.js");
});

test("przyciski wstawiają cyfry i działania do pola", () => {
  const inserts = [...pageHtml.matchAll(/data-wstaw="([^"]*)"/g)].map((m) => m[1]);
  for (const expected of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "×", "÷", ","]) {
    assert.ok(inserts.includes(expected), `brak przycisku wstawiającego ${expected}`);
  }
});

test("przyciski ⌫ i Wyczyść razem wypełniają ostatni wiersz siatki", () => {
  // Regresja: Wyczyść siedział w osobnym wierszu (1fr auto) i jego prawa
  // krawędź kończyła się przed kolumną = i ÷. Teraz ⌫ i Wyczyść dzielą
  // ostatni wiersz: ⌫ na pierwszej kolumnie, Wyczyść od drugiej kolumny
  // do prawej krawędzi siatki, więc prawa krawędź Wyczyść wciąż sięga
  // końca siatki.
  const klawisze = pageHtml.match(/<div class="klawisze">([\s\S]*?)<\/div>/);
  assert.ok(klawisze, "siatka klawiszy istnieje");
  const cofnij = klawisze[1].indexOf('id="cofnij"');
  const wyczysc = klawisze[1].indexOf('id="wyczysc"');
  assert.ok(cofnij > -1, "przycisk ⌫ jest w tej samej siatce co klawisze");
  assert.ok(cofnij < wyczysc, "⌫ stoi tuż przed Wyczyść");
  assert.match(pageCss, /#wyczysc[^}]*grid-column:\s*2\s*\/\s*-1/, "Wyczyść rozpięty od drugiej kolumny do prawej krawędzi siatki");
});

// --- Gotowe, gdy: przyciskiem ⌫ usuwam ostatni znak ---

test("⌫ usuwa ostatni znak z działania", () => {
  assert.equal(removeLast("12 + 3"), "12 + ");
  assert.equal(removeLast("12 + 34"), "12 + 3");
  assert.equal(removeLast("5"), "");
});

test("⌫ przy pustym polu nic nie zmienia i nie rzuca błędu", () => {
  assert.equal(removeLast(""), "");
  assert.doesNotThrow(() => removeLast(""));
});

test("przycisk ⌫ jest obok Wyczyść i woła removeLast z calc.js", () => {
  const klawisze = pageHtml.match(/<div class="klawisze">([\s\S]*?)<\/div>/);
  assert.ok(klawisze, "siatka klawiszy istnieje");
  assert.match(klawisze[1], /⌫/, "przycisk ⌫ jest podpisany symbolem");
  assert.doesNotMatch(pageHtml, /id="cofnij"[^>]*\bdisabled\b/i, "⌫ musi być aktywny");
  assert.match(pageHtml, /import\s*\{[^}]*removeLast[^}]*\}\s*from\s*"\.\/calc\.js"/, "strona importuje removeLast z calc.js");
  assert.match(pageHtml, /removeLast\(\s*wyrazenie\.value\s*\)/, "klik ⌫ usuwa ostatni znak pola Działanie");
});

// --- Gotowe, gdy: wygląda dobrze na telefonie ---

test("wygląda dobrze na telefonie", () => {
  assert.match(pageHtml, /<meta[^>]*name="viewport"[^>]*width=device-width/, "viewport dla telefonów");
  assert.match(pageCss, /@media/, "style łapie wąskie ekrany");
  assert.match(pageCss, /max-width/, "układ nie wychodzi poza ekran");
});

// --- Link z listy kalkulatorów ---

test("lista kalkulatorów linkuje do zwykłego zgłoszenia", () => {
  const listHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(listHtml, /href="zwykly\/"/);
});
