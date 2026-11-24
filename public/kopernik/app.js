// Page wiring for the Kopernik calculator (FOC-1828, round 2).
// This module is the exact code the browser runs, so it lives outside
// index.html and the tests drive it directly (K12): the same initKopernik
// fills the planet list, recomputes on every change and renders the result.
// It receives element objects instead of reaching for document itself, so a
// test can pass plain stubs with the same interface.
import { resultFor, PLANETS, formatNumber } from "./calc.js";

// One short Polish explanation per result row, shown in the tooltip on the
// label and collected under "Co znaczą te wyniki?" (K11).
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

export function initKopernik(elements) {
  const { planeta, dzien, miesiac, rok, wynik, form } = elements;
  const createElement =
    elements.createElement ?? ((tag) => document.createElement(tag));

  for (const p of PLANETS) {
    const opcja = createElement("option");
    opcja.value = p.id;
    opcja.textContent = p.name;
    planeta.appendChild(opcja);
  }

  function licz() {
    try {
      const w = resultFor(
        planeta.value,
        dzien.valueAsNumber,
        miesiac.valueAsNumber,
        rok.valueAsNumber
      );
      wynik.classList.remove("blad");
      wynik.innerHTML = `
        <p class="data">Wynik dla planety ${w.planet}: ${w.dateText}</p>
        <dl>
          <dt title="${POMOC.zodiak}">Znak zodiaku</dt><dd>${w.zodiac}</dd>
          <dt title="${POMOC.dlugosc}">Ekliptyczna długość</dt><dd>${w.longitudeText}</dd>
          <dt title="${POMOC.odleglosc}">Odległość</dt><dd>${formatNumber(w.distanceAu)} au, czyli ${w.distanceText}</dd>
          <dt title="${POMOC.swiatlo}">Czas światła</dt><dd>${w.lightTimeText}</dd>
          <dt title="${POMOC.wstecz}">Ruch wsteczny</dt><dd>${w.retrogradeText}</dd>
          <dt title="${POMOC.model}">Model kół Kopernika</dt><dd>długość ${w.modelLongitudeText}, odległość ${w.modelDistanceText}</dd>
          <dt title="${POMOC.kalendarz}">Kalendarz</dt><dd>${w.calendarNote}</dd>
        </dl>
        <p class="wyjasnienie">Różnica pokazuje, o ile obraz na kołach Kopernika odbiega od
        dzisiejszego liczenia po elipsach: tu ${formatNumber(w.longitudeDiff)} stopnia
        i ${formatNumber(w.distanceDiff)} au.</p>
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
      `;
    } catch (err) {
      wynik.classList.add("blad");
      wynik.innerHTML = `<p class="blad">${err.message}</p>`;
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
  });
}
