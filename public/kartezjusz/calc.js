// Rachunek wiarygodności świadka, porządek Kartezjusza (FOC-1557).
// Wzór z twierdzenia Bayesa o świadku z symetrycznym błędem:
//   P = r*p / (r*p + (1-r)*(1-p)), gdzie p = 1/N (rzadkość), r = wiarygodność.
// Kontrola: N = 1000, r = 0,99 daje 0,0902.

export const PERFECT_WITNESS_NOTE =
  "Sto procent? Takiego świadka jeszcze nie spotkałem.";

// tło rachunku: wykres liczy na 1000 kropkach
const DOT_TOTAL = 1000;

function requireInputs(rarityN, trustPercent) {
  if (!Number.isInteger(rarityN) || rarityN < 1) {
    throw new TypeError(
      "Podaj, na ile przypadków przypada jedno zdarzenie: liczba całkowita, co najmniej 1.",
    );
  }
  if (
    typeof trustPercent !== "number" ||
    !Number.isFinite(trustPercent) ||
    trustPercent < 0 ||
    trustPercent > 100
  ) {
    throw new TypeError("Podaj wiarygodność świadka od 0 do 100 procent.");
  }
}

export function posteriorChance(rarityN, trustPercent) {
  requireInputs(rarityN, trustPercent);
  if (trustPercent === 100) return 1;
  const p = 1 / rarityN;
  const r = trustPercent / 100;
  const truth = r * p;
  return truth / (truth + (1 - r) * (1 - p));
}

export function formatPercent(fraction) {
  const pct = fraction * 100;
  if (pct === 0) return "0%";
  if (pct === 100) return "100%";
  if (pct < 0.05) return "< 0,1%";
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === Math.round(rounded)) return `${Math.round(rounded)}%`;
  return `${rounded.toFixed(1).replace(".", ",")}%`;
}

export function dotCounts(rarityN, trustPercent) {
  requireInputs(rarityN, trustPercent);
  // Kropki liczą zgłoszenia, nie zdarzenia: świadek część prawdziwych
  // zdarzeń przeocza, część zwykłych przypadków bierze za zdarzenie.
  const r = trustPercent / 100;
  const truth = Math.round(DOT_TOTAL * (1 / rarityN) * r);
  const errors = Math.round(DOT_TOTAL * (1 - 1 / rarityN) * (1 - r));
  return { total: DOT_TOTAL, truth, errors, claimed: truth + errors };
}

function odmien(n, formy) {
  if (n === 1) return formy[0];
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return formy[1];
  return formy[2];
}

export function sentenceFor(rarityN, trustPercent) {
  requireInputs(rarityN, trustPercent);
  if (trustPercent === 100) {
    return "Świadek nieomylny nie zna pomyłki: jego zgłoszenie wystarcza, by uznać rzecz za zdarzoną.";
  }
  const dots = dotCounts(rarityN, trustPercent);
  // „Zaledwie" tylko przy wyniku poniżej połowy; przy dokładnie 50% bez niego.
  const zaledwie = posteriorChance(rarityN, trustPercent) < 0.5 ? "zaledwie " : "";
  return (
    `Na ok. ${dots.claimed} ${odmien(dots.claimed, ["zgłoszenie", "zgłoszenia", "zgłoszeń"])} ` +
    `przypada ${zaledwie}${dots.truth} ${odmien(dots.truth, ["prawdziwe", "prawdziwe", "prawdziwych"])}, ` +
    `bo rzecz zdarza się raz na ${rarityN} przypadków, a świadek pomyłkami ją zagłusza.`
  );
}

export function resultFor(rarityN, trustPercent) {
  const chance = posteriorChance(rarityN, trustPercent);
  const perfectWitness = trustPercent === 100;
  return {
    chance,
    chanceText: formatPercent(chance),
    sentence: sentenceFor(rarityN, trustPercent),
    perfectWitness,
    note: perfectWitness ? PERFECT_WITNESS_NOTE : "",
  };
}
