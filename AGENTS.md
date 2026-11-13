# Instructions for agents

- Static site, no build step, no dependencies, no network calls at runtime.
- One calculator per ticket, in its own folder `public/<slug>/` (`zwykly`, `arystoteles`, `leonardo`, `kartezjusz`). Touch only the folder of your ticket, plus a line in `public/index.html` and your tests.
- Put the calculation logic in `public/<slug>/calc.js` as an ES module with named exports, so tests can import it. The page (`index.html`, `style.css`) uses that module.
- UI copy in Polish, informal "ty". No em or en dashes in any copy.
- Must work with keyboard and mouse, and on a 390 px wide phone.
- Tests: `npm test` (runs `node --test`, which picks up `tests/*.test.mjs`). Add `tests/<slug>.test.mjs` covering every "Gotowe, gdy" criterion of the ticket. A test must fail before your change and pass after it.
- Do not change `firebase.json`, the workflow or other calculators.
