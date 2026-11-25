// Page wiring for the Kopernik calculator (FOC-1828, rounds 2 to 4).
// This module is the exact code the browser runs, so it lives outside
// index.html and the tests drive it directly (K12/K12b): the same
// initKopernik fills the planet list, recomputes on every change and renders
// the result, the drawing and the explanations. It receives element objects
// instead of reaching for document itself, so a test can pass plain stubs
// with the same interface.
import {
  resultFor,
  PLANETS,
  formatNumber,
  signPosition,
  formatMlnKm,
  sceneFor,
  ZODIAC_LOCATIVE,
  MIN_YEAR,
  MAX_YEAR,
} from "./calc.js";

// One short Polish explanation per concept, used in the tooltip on the
// label, in the "Co znaczą te wyniki?" section and behind the "?" buttons.
const POMOC = {
  zodiak:
    "Znak zodiaku to odcinek drogi Słońca po niebie, pod którym widzisz planetę z Ziemi. Cała droga ma 12 znaków po 30 stopni.",
  dlugosc:
    "Dokładna pozycja planety na tej drodze, od 0 do 360 stopni. Zero stopni to początek znaku Barana.",
  odleglosc:
    "Jak daleko planeta stoi od Ziemi. Jednostka astronomiczna (au) to średnia odległość Ziemi od Słońca, około 149,6 mln km.",
  swiatlo:
    "Ile minut leci światło od planety do Ziemi. Widzisz planetę taką, jaka była wtedy, gdy światło wyruszyło w drogę.",
  wstecz:
    "Czasem planeta pozornie cofa się na tle gwiazd. To złudzenie wywołane ruchem Ziemi dookoła Słońca, a nie zawracaniem planety.",
  model:
    "Obraz Kopernika: planeta i Ziemia jadą po idealnych kołach wokół Słońca. Dlatego jego liczby mogą się różnić od głównego wyniku, liczonego po elipsach.",
  kalendarz:
    "Kalendarz obowiązujący w tej dacie. Do 14.10.1582 był to kalendarz juliański, od 15.10.1582 jest to gregoriański.",
};

// Texts behind the "?" buttons (K17): they name the current planet and date.
const TEKSTY = {
  odleglosc: (w) =>
    `${w.planet}, ${w.dateText}: ${POMOC.odleglosc} Tu ${w.planet} stoi ${formatNumber(w.distanceAu)} au, czyli ${formatMlnKm(w.distanceKm)}, od Ziemi.`,
  dlugosc: (w) => {
    const pos = signPosition(w.longitude);
    return `${w.planet}, ${w.dateText}: ${POMOC.dlugosc} Tu: ${pos.text}, dokładnie ${w.longitudeText}.`;
  },
  wstecz: (w) => `${w.planet}, ${w.dateText}: ${POMOC.wstecz} Dziś: ${w.retrograde ? "cofa się" : "idzie do przodu"}.`,
  model: (w) =>
    `${w.planet}, ${w.dateText}: ${POMOC.model} Tu koła dają ${w.modelLongitudeText} i ${w.modelDistanceText} wobec ${w.longitudeText} i ${formatNumber(w.distanceAu)} au naprawdę.`,
};

// The circle-model verdict, one sentence in Copernicus's own voice (K19):
// degrees along the ecliptic and percent of distance, "dalej" or "bliżej",
// never a minus sign.
function zdanieKopernika(w) {
  const procent = Math.round((Math.abs(w.distanceDiff) / w.distanceAu) * 100 / 5) * 5;
  // distanceDiff is true minus model, so a negative value means the circles
  // put the planet farther than it really is: that reads as "dalej" (K19).
  const kierunek = w.distanceDiff < 0 ? "dalej" : "bliżej";
  const dokladnosc =
    procent <= 2
      ? "praktycznie tam, gdzie naprawdę"
      : `około ${procent}% ${kierunek}, niż jest naprawdę`;
  return `Na moich kołach wyszłaby ta planeta w długości ${w.modelLongitudeText} zamiast ${w.longitudeText}, a odległość ${w.modelDistanceText} zamiast ${formatNumber(w.distanceAu)} au, czyli o ${formatNumber(Math.abs(w.longitudeDiff))} stopnia wzdłuż ekliptyki i ${dokladnosc}.`;
}

// Top-down drawing of the sky geometry for the selected date (K13): Sun in
// the middle, Earth and planet on their orbits, the sight line between them,
// the zodiac ring with the planet's sign marked and the circle-model shadow.
// Radii are drawn proportional to the square root of distance so Saturn's
// orbit still fits; the caption says so.
function rysujNiebo(w) {
  const planet = PLANETS.find((p) => p.id === w.planetId);
  const scene = sceneFor(planet.key, w.jd);
  const R = Math.PI / 180;
  const CX = 160;
  const CY = 160;
  const SKALA = 34;
  const promien = (au) => Math.sqrt(Math.max(au, 0)) * SKALA;
  const punkt = (v) => {
    const d = Math.hypot(v.x, v.y);
    const a = Math.atan2(v.y, v.x);
    return [CX + promien(d) * Math.cos(a), CY - promien(d) * Math.sin(a)];
  };
  const n = (v) => Math.round(v * 10) / 10;
  const [ex, ey] = punkt(scene.earth);
  const [plx, ply] = punkt(scene.planet);
  const [mx, my] = punkt(scene.model);
  const rPlanety = promien(Math.hypot(scene.planet.x, scene.planet.y));
  const znakStart = Math.floor(w.longitude / 30) * 30;
  let kreski = "";
  for (let s = 0; s < 12; s += 1) {
    const a = s * 30 * R;
    kreski += `<line class="kreska" x1="${n(CX + 112 * Math.cos(a))}" y1="${n(CY - 112 * Math.sin(a))}" x2="${n(CX + 124 * Math.cos(a))}" y2="${n(CY - 124 * Math.sin(a))}"></line>`;
  }
  const a1 = znakStart * R;
  const a2 = (znakStart + 30) * R;
  const midA = (znakStart + 15) * R;
  return `<svg viewBox="0 0 320 320" role="img" aria-label="Rzut z góry: Słońce, orbity Ziemi i planety, obie ciała na swoich miejscach, linia wzroku i obwódka znaków zodiaku">
    <circle class="kolo" cx="${CX}" cy="${CY}" r="${n(promien(1))}"></circle>
    <circle class="kolo" cx="${CX}" cy="${CY}" r="${n(rPlanety)}"></circle>
    ${kreski}
    <path class="znak-aktywny" d="M ${n(CX + 118 * Math.cos(a1))} ${n(CY - 118 * Math.sin(a1))} A 118 118 0 0 0 ${n(CX + 118 * Math.cos(a2))} ${n(CY - 118 * Math.sin(a2))}"></path>
    <text x="${n(CX + 140 * Math.cos(midA))}" y="${n(CY - 140 * Math.sin(midA) + 4)}" text-anchor="middle" class="znak-nazwa">${w.zodiac}</text>
    <line class="linia-wzroku" x1="${n(ex)}" y1="${n(ey)}" x2="${n(plx)}" y2="${n(ply)}"></line>
    <circle class="cien" cx="${n(mx)}" cy="${n(my)}" r="4"></circle>
    <circle class="slonce" cx="${CX}" cy="${CY}" r="6"></circle>
    <circle class="ziemia" cx="${n(ex)}" cy="${n(ey)}" r="4"></circle>
    <circle class="planeta" cx="${n(plx)}" cy="${n(ply)}" r="4"></circle>
    <text x="${CX}" y="${CY + 20}" text-anchor="middle" class="napis">Słońce</text>
    <text x="${n(ex + 6)}" y="${n(ey - 6)}" class="napis">Ziemia</text>
    <text x="${n(plx + 6)}" y="${n(ply - 6)}" class="napis">${w.planet}</text>
  </svg>`;
}

export function initKopernik(elements) {
  const { planeta, dzien, miesiac, rok, wynik, form } = elements;
  const createElement =
    elements.createElement ?? ((tag) => document.createElement(tag));
  const szczegoly = elements.szczegoly;
  const POLA = {
    dzien: [dzien, elements.bladDzien],
    miesiac: [miesiac, elements.bladMiesiac],
    rok: [rok, elements.bladRok],
  };
  let pomocOtwarta = null;

  for (const p of PLANETS) {
    const opcja = createElement("option");
    opcja.value = p.id;
    opcja.textContent = p.name;
    planeta.appendChild(opcja);
  }
  // The form opens on the great Mars opposition of 27.08.2003, so the planet
  // matches the date at boot instead of staying on the first list entry (K18).
  planeta.value = "mars";

  function wyczyscBledy() {
    wynik.classList.remove("blad");
    wynik.classList.remove("przygaszony");
    for (const [inp, msg] of Object.values(POLA)) {
      if (!inp) continue;
      inp.removeAttribute("aria-invalid");
      inp.removeAttribute("aria-describedby");
      if (msg) msg.hidden = true;
    }
  }

  // Which field made the date bad (K20): first empty field, then the year
  // range, then the month, otherwise the day does not exist.
  function poleZBledem(d, m, y) {
    if (Number.isNaN(d)) return "dzien";
    if (Number.isNaN(m)) return "miesiac";
    if (Number.isNaN(y)) return "rok";
    if (y < MIN_YEAR || y > MAX_YEAR) return "rok";
    if (m < 1 || m > 12) return "miesiac";
    return "dzien";
  }

  function render(w) {
    const pos = signPosition(w.longitude);
    const locative = ZODIAC_LOCATIVE[pos.index];
    const panel = pomocOtwarta ? TEKSTY[pomocOtwarta](w) : "";
    return `
        <p class="data">Wynik dla planety ${w.planet}: ${w.dateText}</p>
        <p class="sentencja">${w.planet} stoi w ${locative} i ${w.retrograde ? "cofa się na tle gwiazd" : "idzie po niebie do przodu"}.</p>
        <dl>
          <dt title="${POMOC.zodiak}">Znak zodiaku</dt><dd>${pos.sign}</dd>
          <dt title="${POMOC.dlugosc}">Ekliptyczna długość</dt><dd>${pos.text} <span class="szczegol">(dokładnie ${w.longitudeText})</span><button type="button" class="pomoc" data-pomoc="dlugosc" aria-expanded="${pomocOtwarta === "dlugosc"}" aria-controls="panel-pomoc">?</button></dd>
          <dt title="${POMOC.odleglosc}">Odległość</dt><dd>${formatNumber(w.distanceAu)} au, czyli ${formatMlnKm(w.distanceKm)}<button type="button" class="pomoc" data-pomoc="odleglosc" aria-expanded="${pomocOtwarta === "odleglosc"}" aria-controls="panel-pomoc">?</button></dd>
          <dt title="${POMOC.swiatlo}">Czas światła</dt><dd>${w.lightTimeText}; dla porównania, światło ze Słońca leci do nas około 8 minut</dd>
          <dt title="${POMOC.wstecz}">Ruch wsteczny</dt><dd>${w.retrograde ? "tak, cofa się" : "nie, idzie do przodu"}<button type="button" class="pomoc" data-pomoc="wstecz" aria-expanded="${pomocOtwarta === "wstecz"}" aria-controls="panel-pomoc">?</button></dd>
          <dt title="${POMOC.model}">Model kół Kopernika</dt><dd>długość ${w.modelLongitudeText}, odległość ${w.modelDistanceText}<button type="button" class="pomoc" data-pomoc="model" aria-expanded="${pomocOtwarta === "model"}" aria-controls="panel-pomoc">?</button></dd>
          <dt title="${POMOC.kalendarz}">Kalendarz</dt><dd>${w.calendarNote}</dd>
        </dl>
        <p class="wyjasnienie">${zdanieKopernika(w)} Różnica pokazuje, o ile obraz na kołach Kopernika odbiega od dzisiejszego liczenia po elipsach.</p>
        <div id="panel-pomoc" class="panel-pomoc"${pomocOtwarta ? "" : " hidden"}>${panel}</div>
        <details class="objasnienia">
          <summary>Co znaczą te wyniki?</summary>
          <p><strong>Znak zodiaku:</strong> ${POMOC.zodiak}</p>
          <p><strong>Ekliptyczna długość:</strong> ${POMOC.dlugosc}</p>
          <p><strong>Odległość:</strong> ${POMOC.odleglosc}</p>
          <p><strong>Czas światła:</strong> ${POMOC.swiatlo}</p>
          <p><strong>Ruch wsteczny:</strong> ${POMOC.wstecz}</p>
          <p><strong>Model kół Kopernika:</strong> ${POMOC.model}</p>
          <p><strong>Kalendarz:</strong> ${POMOC.kalendarz}</p>
        </details>
        <figure class="obraz">
          ${rysujNiebo(w)}
          <figcaption class="legenda">Szkic z góry na ${w.dateText}: Słońce w środku, orbity Ziemi i planety, oba ciała na swoich miejscach, linia wzroku od Ziemi do planety i obwódka znaków zodiaku z zaznaczonym znakiem ${w.zodiac}. Pusty okrąg pokazuje, gdzie postawiłaby planetę koła Kopernika. Promienie są skrócone pierwiastkiem, żeby całość zmieściła się na rysunku.</figcaption>
        </figure>
      `;
  }

  function licz() {
    wyczyscBledy();
    try {
      const w = resultFor(
        planeta.value,
        dzien.valueAsNumber,
        miesiac.valueAsNumber,
        rok.valueAsNumber
      );
      wynik.innerHTML = render(w);
    } catch (err) {
      // K20: a bad date never wipes the previous result. It stays on screen,
      // dimmed, and the message lands next to the offending field.
      wynik.classList.add("blad");
      wynik.classList.add("przygaszony");
      const id = poleZBledem(
        dzien.valueAsNumber,
        miesiac.valueAsNumber,
        rok.valueAsNumber
      );
      const [inp, msg] = POLA[id];
      inp.setAttribute("aria-invalid", "true");
      inp.setAttribute("aria-describedby", `blad-${id}`);
      if (msg) {
        msg.textContent = err.message;
        msg.hidden = false;
      }
    }
  }

  // K10: every input field and the planet list recompute at once; the button
  // recomputes for whatever is on screen at the moment of the click.
  planeta.addEventListener("change", licz);
  for (const pole of [dzien, miesiac, rok]) pole.addEventListener("input", licz);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    licz();
  });

  // K17: the "?" buttons live inside the rendered result, so one listener on
  // the result section catches them by delegation and the re-render carries
  // the open panel and the aria-expanded state.
  wynik.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-pomoc]");
    if (!btn) return;
    const key = btn.getAttribute("data-pomoc");
    pomocOtwarta = pomocOtwarta === key ? null : key;
    licz();
  });

  // K18: example buttons set the planet and the date together; K21 lets the
  // form collapse after the pick so the result sentence stays on screen.
  function ustaw(ex) {
    if (ex.planeta) planeta.value = ex.planeta;
    dzien.value = ex.dzien;
    miesiac.value = ex.miesiac;
    rok.value = ex.rok;
    if (szczegoly) szczegoly.open = false;
    licz();
  }
  if (elements.przykladMars) {
    elements.przykladMars.addEventListener("click", () =>
      ustaw({ planeta: "mars", dzien: "27", miesiac: "8", rok: "2003" })
    );
  }
  if (elements.przykladSaturn) {
    elements.przykladSaturn.addEventListener("click", () =>
      ustaw({ planeta: "saturn", dzien: "24", miesiac: "5", rok: "1543" })
    );
  }
  if (elements.przykladDzis) {
    elements.przykladDzis.addEventListener("click", () => {
      const t = new Date();
      ustaw({
        planeta: null,
        dzien: String(t.getDate()),
        miesiac: String(t.getMonth() + 1),
        rok: String(t.getFullYear()),
      });
    });
  }

  licz();

  return { licz };
}

// Browser boot: a module script runs after the document is parsed, so the
// page's elements exist by the time this module evaluates. Importing the
// module is therefore enough to get a working page. The guard keeps plain
// imports outside the browser (the tests drive initKopernik with their own
// element stubs) from touching a document that is not there.
if (typeof document !== "undefined") {
  initKopernik({
    planeta: document.getElementById("planeta"),
    dzien: document.getElementById("dzien"),
    miesiac: document.getElementById("miesiac"),
    rok: document.getElementById("rok"),
    wynik: document.getElementById("wynik"),
    form: document.getElementById("pytanie"),
    szczegoly: document.getElementById("szczegoly"),
    bladDzien: document.getElementById("blad-dzien"),
    bladMiesiac: document.getElementById("blad-miesiac"),
    bladRok: document.getElementById("blad-rok"),
    przykladDzis: document.getElementById("przyklad-dzis"),
    przykladMars: document.getElementById("przyklad-mars"),
    przykladSaturn: document.getElementById("przyklad-saturn"),
  });
}
