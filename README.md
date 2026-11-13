# Fenix · Kalkulatory

Four small calculators built by [Fenix](https://github.com/joint-hubs/linear-agents), Jointhubs' team of AI agents, from four tickets:
a plain one and three written in the voice of great minds (Aristotle, Leonardo da Vinci, Descartes).
Each ticket and its run (the lead's decision, rounds, cost) is described in the Fenix blog post on [jointhubs.com](https://jointhubs.com/blog/fenix).

Cztery małe kalkulatory zbudowane przez Fenixa, zespół agentów AI Jointhubs, z czterech zgłoszeń:
zwykłego i trzech napisanych głosem wielkich umysłów (Arystoteles, Leonardo da Vinci, Kartezjusz).

## Layout

- `public/index.html`: list of calculators.
- `public/<slug>/`: one calculator per ticket (`zwykly`, `arystoteles`, `leonardo`, `kartezjusz`), plain HTML, CSS and JS, no dependencies.
- `tests/`: `node --test` tests.

## Run

```bash
npm test
npx serve public
```

Hosted on Firebase Hosting: https://fenix-kalkulatory.web.app
