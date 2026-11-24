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
    assert.match(elements.wynik.innerHTML, /Merkury/);
    assert.match(elements.wynik.innerHTML, /27 sierpnia 2003 roku/);

    elements.planeta.value = "jowisz";
    elements.pytanie.dispatch("submit");
    assert.match(elements.wynik.innerHTML, /Jowisz/);
    assert.doesNotMatch(elements.wynik.innerHTML, /Merkury/);
  });
});
