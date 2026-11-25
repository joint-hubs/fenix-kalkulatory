// K12b: the page starts itself after load. This file drives the page the way
// a browser does: it reads index.html, builds a document stub from the
// elements the page declares (ids, tags, values, the form), then imports the
// page's module scripts, resolving each src relative to the HTML file. It
// never calls initKopernik by hand; if the page does not start on its own,
// the planet list stays empty and the assertions below fail. It lives in its
// own file so the page module is evaluated exactly once, with this stub
// document already in place (node runs every test file in a fresh process).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const htmlUrl = new URL("../public/kopernik/index.html", import.meta.url);
const pageHtml = readFileSync(htmlUrl, "utf8");

// Minimal element stub with the interface app.js uses: value and
// valueAsNumber like a browser input, collected listeners and classes,
// select-like appendChild that picks the first option.
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

// Elements straight from the page: every id="..." in index.html becomes a
// stub of the right tag, with the HTML value attribute when there is one.
const elements = {};
for (const m of pageHtml.matchAll(/<(\w+)\b([^>]*)>/g)) {
  const id = m[2].match(/\sid="([^"]+)"/)?.[1];
  if (!id || elements[id]) continue;
  const el = stubElement(m[1]);
  const value = m[2].match(/\bvalue="([^"]*)"/)?.[1];
  if (value !== undefined) el.value = value;
  elements[id] = el;
}

describe("K12b: strona startuje sama po załadowaniu", () => {
  it("załadowanie strony wypełnia 5 planet, renderuje wynik, a Policz po zmianie planety przelicza", async () => {
    // The stub document must exist before the page modules are evaluated.
    globalThis.document = {
      getElementById: (id) => elements[id] ?? null,
      createElement: (tag) => stubElement(tag),
    };

    // The page's module scripts, imported the way a browser does: each src
    // resolved relative to the HTML file.
    const scripts = [];
    for (const m of pageHtml.matchAll(/<script\b([^>]*)>/g)) {
      const attrs = m[1];
      if (!/\btype="module"/.test(attrs)) continue;
      const src = attrs.match(/\bsrc="([^"]+)"/)?.[1];
      if (src) scripts.push(src);
    }
    assert.ok(scripts.length > 0, "strona ładuje swój moduł");
    for (const src of scripts) {
      await import(new URL(src, htmlUrl).href);
    }

    assert.equal(elements.planeta.children.length, 5);
    // K18: data startowa 27.08.2003 to wielkie zbliżenie Marsa, więc przy
    // otwarciu strony wybrany jest Mars, nie pierwsza planeta z listy.
    assert.equal(elements.planeta.value, "mars");
    assert.match(elements.wynik.innerHTML, /Mars/);
    assert.match(elements.wynik.innerHTML, /27 sierpnia 2003 roku/);

    elements.planeta.value = "jowisz";
    elements.pytanie.dispatch("submit");
    assert.match(elements.wynik.innerHTML, /Jowisz/);
    assert.doesNotMatch(elements.wynik.innerHTML, /Merkury/);
  });

  it("K18: przyciski przykładów ustawiają planetę i datę razem", () => {
    assert.ok(elements["przyklad-mars"], "strona ma przycisk przyklad-mars");
    assert.ok(elements["przyklad-saturn"], "strona ma przycisk przyklad-saturn");
    assert.ok(elements["przyklad-dzis"], "strona ma przycisk przyklad-dzis");

    elements["przyklad-mars"].dispatch("click");
    assert.equal(elements.planeta.value, "mars");
    assert.equal(elements.dzien.value, "27");
    assert.equal(elements.miesiac.value, "8");
    assert.equal(elements.rok.value, "2003");
    assert.match(elements.wynik.innerHTML, /Mars stoi w Rybach/);

    elements["przyklad-saturn"].dispatch("click");
    assert.equal(elements.planeta.value, "saturn");
    assert.equal(elements.rok.value, "1543");
    assert.match(elements.wynik.innerHTML, /Saturn/);

    elements["przyklad-dzis"].dispatch("click");
    const dzis = new Date();
    assert.equal(elements.dzien.value, String(dzis.getDate()));
    assert.equal(elements.miesiac.value, String(dzis.getMonth() + 1));
    assert.equal(elements.rok.value, String(dzis.getFullYear()));
    assert.equal(elements.planeta.value, "saturn");
  });

  it("K21: po wybraniu przykładu formularz się zwija i zdanie z wynikiem jest widoczne", () => {
    assert.ok(elements["szczegoly"], "formularz jest w zwijanym pudle");
    elements["przyklad-mars"].dispatch("click");
    assert.equal(elements["szczegoly"].open, false);
    assert.match(elements.wynik.innerHTML, /Wynik dla planety Mars/);
  });

  it("K13: rysunek stawia planetę w różnych miejscach dla różnych dat i mówi prawdę w podpisie", () => {
    const pozycjaPlanety = () => {
      const m = elements.wynik.innerHTML.match(/class="planeta"[^>]*cx="([0-9.]+)"[^>]*cy="([0-9.]+)"/);
      assert.ok(m, "rysunek ma kropkę planety");
      return `${m[1]},${m[2]}`;
    };

    elements["przyklad-mars"].dispatch("click");
    const mars = pozycjaPlanety();
    elements.planeta.value = "jowisz";
    elements.planeta.dispatch("change");
    elements.dzien.value = "24";
    elements.dzien.dispatch("input");
    elements.miesiac.value = "11";
    elements.miesiac.dispatch("input");
    elements.rok.value = "2026";
    elements.rok.dispatch("input");
    const jowisz = pozycjaPlanety();
    assert.notEqual(mars, jowisz, "kropka planety zależy od daty i planety");

    const podpis = elements.wynik.innerHTML;
    assert.match(podpis, /<figcaption[^>]*>[^<]*Słońce/);
    assert.match(podpis, /Kopernika/);
    assert.match(podpis, /Ziemi/);
  });
});
