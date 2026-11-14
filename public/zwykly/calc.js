// Calculation logic for Zwykłe zgłoszenie.
// Pure module with named exports, no DOM here, so tests can import it.

export const DIVIDE_BY_ZERO_MESSAGE = "Nie można dzielić przez zero.";
export const FORMAT_MESSAGE = "Wpisz działanie w formacie 2 + 2.";

const NUMBER = "[+-]?(?:\\d+(?:[.,]\\d+)?|[.,]\\d+)";
const OPERATOR = "[+\\-*/×÷]";
const EXPRESSION = new RegExp(`^\\s*(${NUMBER})\\s*(${OPERATOR})\\s*(${NUMBER})\\s*$`);

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

// null instead of NaN, Infinity or a thrown error on division by zero.
export function divide(a, b) {
  return b === 0 ? null : a / b;
}

function parseNumber(text) {
  return Number(text.replace(",", "."));
}

// evaluate("2 + 2") -> { ok: true, value: 4 }
// evaluate("4 / 0") -> { ok: false, error: "Nie można dzielić przez zero." }
export function evaluate(expression) {
  const match = EXPRESSION.exec(String(expression ?? ""));
  if (!match) return { ok: false, error: FORMAT_MESSAGE };
  const a = parseNumber(match[1]);
  const b = parseNumber(match[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false, error: FORMAT_MESSAGE };
  switch (match[2]) {
    case "+":
      return { ok: true, value: add(a, b) };
    case "-":
      return { ok: true, value: subtract(a, b) };
    case "*":
    case "×":
      return { ok: true, value: multiply(a, b) };
    case "/":
    case "÷": {
      const value = divide(a, b);
      return value === null ? { ok: false, error: DIVIDE_BY_ZERO_MESSAGE } : { ok: true, value };
    }
    default:
      return { ok: false, error: FORMAT_MESSAGE };
  }
}

// Display form: trimmed float, Polish comma as the decimal separator.
export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded).replace(".", ",");
}
