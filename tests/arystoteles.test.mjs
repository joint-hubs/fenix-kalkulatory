import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OBJECTS,
  LIGHT_SPEED_KMS,
  SECONDS_PER_YEAR,
  travelSeconds,
  travelYears,
  departureYear,
  formatDuration,
  formatYear,
  resultFor,
  monologue,
  WORLD_FACTS,
} from "../public/arystoteles/calc.js";

const page = () =>
  readFileSync(new URL("../public/arystoteles/index.html", import.meta.url), "utf8");
const listPage = () =>
  readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const style = () =>
  readFileSync(new URL("../public/arystoteles/style.css", import.meta.url), "utf8");

test("AC1: the page lists all five objects and uses calc.js", () => {
  const html = page();
  for (const object of OBJECTS) {
    assert.ok(html.includes(object.name), `missing ${object.name}`);
    assert.ok(html.includes(`value="${object.id}"`), `missing radio for ${object.id}`);
  }
  assert.equal(OBJECTS.length, 5);
  assert.match(html, /calc\.js/);
});

test("AC1: every object reports how long its light travelled", () => {
  for (const object of OBJECTS) {
    const result = resultFor(object.id, 2026);
    assert.ok(result.durationText.length > 0, `no duration for ${object.id}`);
  }
});

test("AC2: sunlight takes about 8 minutes", () => {
  const sun = OBJECTS.find((object) => object.id === "slonce");
  const seconds = travelSeconds(sun);
  assert.ok(seconds > 8 * 60 && seconds < 9 * 60, `sun: ${seconds} s`);
  assert.equal(resultFor("slonce", 2026).durationText, "8,3 minuty");
});

test("AC2: moonlight takes a bit over a second", () => {
  const moon = OBJECTS.find((object) => object.id === "ksiezyc");
  const seconds = travelSeconds(moon);
  assert.ok(seconds > 1 && seconds < 1.5, `moon: ${seconds} s`);
  assert.equal(resultFor("ksiezyc", 2026).durationText, "1,3 sekundy");
});

test("AC3: stars also show the year their light departed", () => {
  const result = resultFor("gwiazda-polarna", 2026);
  assert.equal(result.departureYear, 1593); // 2026 - 433, about 1590
  assert.ok(Math.abs(result.departureYear - 1590) <= 10, `polaris: ${result.departureYear}`);
  assert.equal(result.yearText, "1593");

  const sirius = resultFor("syriusz", 2026);
  assert.equal(sirius.departureYear, 2017); // 2026 - 8,6
  assert.equal(sirius.yearText, "2017");
});

test("AC3: the departure year comes from the given year, never the clock", () => {
  assert.equal(departureYear(2026, 433), 1593);
  assert.equal(departureYear(2000, 433), 1567);
  assert.equal(departureYear(2026, travelYears(OBJECTS.find((o) => o.id === "gwiazda-polarna"))), 1593);
});

test("AC4: big numbers stay readable, never scientific notation", () => {
  const result = resultFor("galaktyka-andromedy", 2026);
  assert.equal(result.durationText, "2,5 miliona lat");
  assert.doesNotMatch(result.durationText, /[eE][+-]?\d/);
  assert.equal(formatDuration(2500000 * SECONDS_PER_YEAR), "2,5 miliona lat");
  assert.doesNotMatch(formatDuration(2500000 * SECONDS_PER_YEAR), /[eE][+-]?\d/);
});

test("AC4: distant objects show their departure year readably too", () => {
  const result = resultFor("galaktyka-andromedy", 2026);
  const plain = result.yearText.replace(/ /g, " ");
  assert.match(plain, /p\.n\.e\.$/);
  assert.doesNotMatch(plain, /[eE][+-]?\d/);
});

test("the light speed and year length are the pinned ones", () => {
  assert.equal(LIGHT_SPEED_KMS, 299792.458);
  assert.equal(SECONDS_PER_YEAR, 31557600);
  const moon = OBJECTS.find((object) => object.id === "ksiezyc");
  assert.equal(travelSeconds(moon), 384400 / 299792.458);
});

test("AC4: formatYear keeps both eras readable", () => {
  assert.equal(formatYear(1593), "1593");
  assert.equal(formatYear(-2497974).replace(/ /g, " "), "2 497 975 p.n.e.");
});

test("the calculators list links to the Arystoteles calculator", () => {
  assert.match(listPage(), /href="arystoteles\/"/);
});

test("the Sun's monologue is the three sentences of the report", () => {
  assert.deepEqual(monologue("slonce", 2026), [
    "Światło Słońca leciało do ciebie około 8 minut.",
    "Uczyłem, że światło nie potrzebuje czasu.",
    "Myliłem się.",
  ]);
});

test("star monologues give time, year and one certain fact of that year", () => {
  assert.deepEqual(monologue("gwiazda-polarna", 2026), [
    "Światło Gwiazdy Polarnej leciało do ciebie 433 lata.",
    "Wyruszyło w roku 1593.",
    "Około 1593: Galileusz wykłada w Padwie.",
  ]);
  const sirius = monologue("syriusz", 2026);
  assert.ok(sirius[0].includes("Światło Syriusza leciało do ciebie"));
  assert.ok(sirius[1].includes("Wyruszyło w roku 2017."));
  assert.ok(sirius[2].includes("Około 2017: tej strony jeszcze nie było."));
});

test("the fact table holds only certain facts", () => {
  assert.deepEqual(WORLD_FACTS, {
    "gwiazda-polarna": "Galileusz wykłada w Padwie",
    syriusz: "tej strony jeszcze nie było",
  });
});

test("Andromeda's monologue says our species was not there yet", () => {
  assert.deepEqual(monologue("galaktyka-andromedy", 2026), [
    "Światło Galaktyki Andromedy leciało do ciebie 2,5 miliona lat.",
    "Gdy to światło wyruszyło, nie było jeszcze naszego gatunku.",
  ]);
});

test("the Moon's monologue speaks of a bit over a second", () => {
  assert.deepEqual(monologue("ksiezyc", 2026), [
    "Światło Księżyca leciało do ciebie nieco ponad sekundę.",
    "Patrzysz w przeszłość, choć bardzo młodą.",
  ]);
});

test("the report page names its author under the heading", () => {
  const html = page();
  assert.match(html, /<h1>Jak dawno wyruszyło światło\?<\/h1>/);
  assert.match(html, /Zgłasza: Arystoteles \(384-322 p\.n\.e\.\)/);
});

test("the sky map has five points and the radios stay for the keyboard", () => {
  const html = page();
  assert.match(html, /<svg/);
  for (const object of OBJECTS) {
    assert.ok(html.includes(`data-id="${object.id}"`), `no map point for ${object.id}`);
    assert.ok(html.includes(`value="${object.id}"`), `no radio for ${object.id}`);
  }
  assert.match(html, /addEventListener\("click"/);
});

test("no sky map label leaves the viewBox", () => {
  const html = page();
  assert.match(style(), /text-anchor: middle/);
  const box = html.match(/viewBox="0 0 (\d+) (\d+)"/);
  const W = Number(box[1]);
  const H = Number(box[2]);
  const groups = [...html.matchAll(/<g class="punkt"[^>]*transform="translate\(([\d.]+), ([\d.]+)\)"[^>]*>([\s\S]*?)<\/g>/g)];
  assert.equal(groups.length, 5);
  const CHAR_W = 7;  // viewBox units, a safe upper bound for one 11px serif glyph
  const CHAR_H = 11;
  for (const [, gx, gy, body] of groups) {
    const x = Number(gx);
    const y = Number(gy);
    const labels = [...body.matchAll(/<text y="(-?[\d.]+)">([^<]+)<\/text>/g)];
    assert.ok(labels.length >= 1, `no label at ${gx},${gy}`);
    for (const [, dy, label] of labels) {
      const baseline = y + Number(dy);
      const half = (label.length * CHAR_W) / 2;
      assert.ok(x - half >= 0, `"${label}" leaves the left edge`);
      assert.ok(x + half <= W, `"${label}" leaves the right edge`);
      assert.ok(baseline - CHAR_H >= 0, `"${label}" leaves the top edge`);
      assert.ok(baseline <= H, `"${label}" leaves the bottom edge`);
    }
  }
});

test("the page wears a Greek meander band top and bottom", () => {
  const html = page();
  assert.match(html, /class="pas pas-gorny"/);
  assert.match(html, /class="pas pas-dolny"/);
  assert.match(style(), /data:image\/svg\+xml/);
});

test("the page is warm paper in a system serif", () => {
  const css = style();
  assert.match(css, /Georgia/);
  assert.match(css, /"Times New Roman", serif/);
  assert.match(css, /--papier: #[fF]/);
  assert.doesNotMatch(page(), /@import|https?:\/\//);
});

test("the glow of a chosen point respects prefers-reduced-motion", () => {
  assert.match(style(), /prefers-reduced-motion/);
});

test("no copy anywhere carries an em dash or an en dash", () => {
  const dash = /[–—]/;
  for (const object of OBJECTS) {
    for (const line of monologue(object.id, 2026)) {
      assert.doesNotMatch(line, dash, `dash in: ${line}`);
    }
  }
  assert.doesNotMatch(page(), dash);
  assert.doesNotMatch(listPage(), dash);
});
