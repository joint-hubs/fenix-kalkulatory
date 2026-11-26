// FOC-1886: czytelny rysunek nieba. These tests drive initKopernik with
// plain element stubs (the same interface the page uses) and inspect the
// rendered SVG string, so no DOM is needed. They were written before the
// fix and must fail on the current drawing (R1 to R5 of the ticket).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initKopernik } from "../public/kopernik/app.js";
import { resultFor } from "../public/kopernik/calc.js";

const css = readFileSync(new URL("../public/kopernik/style.css", import.meta.url), "utf8");
const appJs = readFileSync(new URL("../public/kopernik/app.js", import.meta.url), "utf8");

// Element stub with the interface app.js touches: value and valueAsNumber
// like a browser input, collected listeners, classList, select-like
// appendChild that picks the first option.
function stubElement(tag) {
  return {
    tagName: tag,
    children: [],
    listeners: {},
    value: "",
    textContent: "",
    innerHTML: "",
    hidden: false,
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
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    get valueAsNumber() {
      if (this.value === "" || this.value == null) return NaN;
      return Number(this.value);
    },
  };
}

// Render the result for one planet and date, return the SVG string.
function rysunek(planetId, dzien, miesiac, rok) {
  const el = {
    planeta: stubElement("select"),
    dzien: stubElement("input"),
    miesiac: stubElement("input"),
    rok: stubElement("input"),
    wynik: stubElement("section"),
    form: stubElement("form"),
  };
  const api = initKopernik({ ...el, createElement: () => stubElement("option") });
  el.planeta.value = planetId;
  el.dzien.value = String(dzien);
  el.miesiac.value = String(miesiac);
  el.rok.value = String(rok);
  api.licz();
  const m = el.wynik.innerHTML.match(/<svg[\s\S]*<\/svg>/);
  assert.ok(m, "render zawiera rysunek svg");
  return m[0];
}

// Label geometry: an approximate box around a text element. Font is 11px,
// so a character is about 6.2px wide; y is the baseline.
function boxNapisu(x, y, text, anchor) {
  const w = text.length * 6.2;
  const x0 = anchor === "middle" ? x - w / 2 : x;
  return { x0, x1: x0 + w, y0: y - 9, y1: y + 2 };
}

function przecina(a, b) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

function odlegloscPunktPudlo(px, py, b) {
  const dx = Math.max(b.x0 - px, 0, px - b.x1);
  const dy = Math.max(b.y0 - py, 0, py - b.y1);
  return Math.hypot(dx, dy);
}

// Shortest distance from a segment to a box, by sampling along the segment.
function odlegloscOdcinekPudlo(x1, y1, x2, y2, b) {
  let min = Infinity;
  for (let t = 0; t <= 1; t += 0.02) {
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    min = Math.min(min, odlegloscPunktPudlo(px, py, b));
  }
  return min;
}

// Pull the three body labels (Słońce, Ziemia, planet) out of the SVG.
function napisy(svg) {
  const out = [];
  for (const m of svg.matchAll(/<text x="([0-9.-]+)" y="([0-9.-]+)"(?: text-anchor="(\w+)")? class="napis">([^<]+)<\/text>/g)) {
    out.push({ x: Number(m[1]), y: Number(m[2]), anchor: m[3] ?? "start", text: m[4] });
  }
  return out;
}

function kropki(svg) {
  const out = [];
  for (const m of svg.matchAll(/<circle class="(slonce|ziemia|planeta)" cx="([0-9.-]+)" cy="([0-9.-]+)" r="4"><\/circle>/g)) {
    out.push({ klasa: m[1], x: Number(m[2]), y: Number(m[3]) });
  }
  return out;
}

function liniaWzroku(svg) {
  const m = svg.match(/<line class="linia-wzroku" x1="([0-9.-]+)" y1="([0-9.-]+)" x2="([0-9.-]+)" y2="([0-9.-]+)"/);
  assert.ok(m, "rysunek ma linię wzroku");
  return { x1: Number(m[1]), y1: Number(m[2]), x2: Number(m[3]), y2: Number(m[4]) };
}

// R2 for one scenario: the three labels must not overlap each other, must
// clear the three dots (with a 2px margin) and must stay off the sight line.
function sprawdzEtykiety(svg, nazwa) {
  const etykiety = napisy(svg).map((nt) => boxNapisu(nt.x, nt.y, nt.text, nt.anchor));
  assert.equal(etykiety.length, 3, `${nazwa}: trzy etykiety ciał`);
  for (let i = 0; i < etykiety.length; i += 1) {
    for (let j = i + 1; j < etykiety.length; j += 1) {
      assert.ok(!przecina(etykiety[i], etykiety[j]),
        `${nazwa}: etykiety ${napisy(svg)[i].text} i ${napisy(svg)[j].text} na siebie nachodzą`);
    }
  }
  const kropki2 = kropki(svg);
  assert.equal(kropki2.length, 3, `${nazwa}: trzy kropki ciał`);
  const pudlaKropek = kropki2.map((k) => ({ x0: k.x - 6, x1: k.x + 6, y0: k.y - 6, y1: k.y + 6 }));
  for (const etykieta of etykiety) {
    for (const pudlo of pudlaKropek) {
      assert.ok(!przecina(etykieta, pudlo), `${nazwa}: etykieta nachodzi na kropkę`);
    }
  }
  const linia = liniaWzroku(svg);
  for (const etykieta of etykiety) {
    const d = odlegloscOdcinekPudlo(linia.x1, linia.y1, linia.x2, linia.y2, etykieta);
    assert.ok(d >= 2, `${nazwa}: etykieta zbyt blisko linii wzroku (${d.toFixed(1)}px)`);
  }
}

describe("FOC-1886: czytelny rysunek nieba", () => {
  it("R1: rysunek wypełnia kolumnę (brak capsy 320px, svg ma width 100%)", () => {
    assert.doesNotMatch(css, /max-width:\s*320px/, "svg ma capsę max-width: 320px");
    const regulaSvg = css.match(/svg\s*\{[^}]*\}/);
    assert.ok(regulaSvg, "style.css ma regułę dla svg");
    assert.match(regulaSvg[0], /width:\s*100%/, "svg rozciąga się na szerokość kolumny");
  });

  it("R2: etykiety ciał nie nachodzą na siebie, kropki ani linię wzroku (Mars 27.08.2003)", () => {
    sprawdzEtykiety(rysunek("mars", 27, 8, 2003), "Mars 27.08.2003");
  });

  it("R2: etykiety są czytelne także dla innych par planeta i data", () => {
    sprawdzEtykiety(rysunek("wenus", 5, 6, 2012), "Wenus 05.06.2012");
    sprawdzEtykiety(rysunek("saturn", 24, 5, 1543), "Saturn 24.05.1543");
    sprawdzEtykiety(rysunek("merkury", 1, 1, 2026), "Merkury 01.01.2026");
  });

  it("R3: pierścień zodiaku ma wszystkie 12 znaków, a znak planety jest wyróżniony", () => {
    const svg = rysunek("mars", 27, 8, 2003);
    const znaki = [...svg.matchAll(/<text [^>]*class="znak-nazwa[^"]*"[^>]*>([^<]+)<\/text>/g)];
    assert.equal(znaki.length, 12, "rysunek ma 12 etykiet znaków");
    const teksty = new Set(znaki.map((m) => m[1]));
    assert.equal(teksty.size, 12, "etykiety znaków są różne");
    const aktywne = [...svg.matchAll(/<text [^>]*class="[^"]*aktywny[^"]*"[^>]*>([^<]+)<\/text>/g)];
    assert.equal(aktywne.length, 1, "dokładnie jeden znak jest wyróżniony");
    const w = resultFor("mars", 27, 8, 2003);
    const oczekiwany = Math.floor(w.longitude / 30);
    for (const m of svg.matchAll(/<text x="([0-9.-]+)" y="([0-9.-]+)"[^>]*class="([^"]*znak-nazwa[^"]*)"[^>]*>([^<]+)<\/text>/g)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      assert.ok(x >= 4 && x <= 316 && y >= 4 && y <= 316, `etykieta znaku ${m[4]} wychodzi z rysunku (${x}, ${y})`);
      const kat = (Math.atan2(160 - y, x - 160) * 180) / Math.PI;
      const normalny = (Math.round(kat) + 360) % 360;
      const sektor = Math.floor(((normalny + 15) % 360) / 30);
      if (m[3].includes("aktywny")) {
        assert.equal(sektor, oczekiwany, "wyróżniony znak to znak planety");
      }
    }
  });

  it("R4: kropka planety zależy od planety i daty (Mars 2003 vs Jowisz 2026)", () => {
    const pozycja = (svg) => {
      const m = svg.match(/class="planeta" cx="([0-9.-]+)" cy="([0-9.-]+)"/);
      assert.ok(m, "rysunek ma kropkę planety");
      return `${m[1]},${m[2]}`;
    };
    const mars = pozycja(rysunek("mars", 27, 8, 2003));
    const jowisz = pozycja(rysunek("jowisz", 24, 11, 2026));
    assert.notEqual(mars, jowisz, "kropka planety różni się między scenariuszami");
  });

  it("R5: żadnych półpauż i pauz w kopii, rysunek nie sięga po sieć", () => {
    const html = rysunek("mars", 27, 8, 2003);
    for (const [nazwa, tekst] of [["rysunek", html], ["style.css", css], ["app.js", appJs]]) {
      assert.doesNotMatch(tekst, /[–—]/, `${nazwa} zawiera półpauzę lub pauzę`);
    }
    assert.doesNotMatch(html, /http/, "rysunek nie odwołuje się do sieci");
  });
});
