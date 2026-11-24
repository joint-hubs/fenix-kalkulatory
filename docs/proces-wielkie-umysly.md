# Test zdolności Fenixa: kalkulatory wielkich umysłów

Każda runda sprawdza, jak Fenix samodzielnie dowozi małą, ale nietrywialną aplikację od planu do PR.

## Runda krok po kroku

1. **Losowanie.** Wielki umysł losowany z listy 32 postaci (`secrets.choice`), bez powtórek z poprzednich rund. Wynik pokazany właścicielowi przed pisaniem planu.
2. **Plan.** Lider (sesja Claude prowadząca Fenixa) pisze plan głosem postaci: list oraz tabela kryteriów K1…Kn z przykładami i tolerancjami. Warunek: kalkulator liczy coś, czego w czasach postaci nie dało się policzyć. Wartości referencyjne pochodzą z wiarygodnego źródła, które plan wymienia. Plan leży w `docs/plany/<slug>.md`.
3. **Zadanie.** Plan trafia do HQ jako zadanie w projekcie „Fenix · Kalkulatory”, a kryteria K1…Kn stają się jego kryteriami akceptacji. Start dopiero po akceptacji planu przez właściciela.
4. **Budowa.** Fenix robi całość sam: triage, plan, programista, tester, bramka wypchnięcia i PR. Limit kosztów to 10 USD na kalkulator.
   - Lider uruchamia zadanie i odpowiada tylko na bramki proceduralne. Nie pisze kodu kalkulatora i nie podpowiada rozwiązań.
   - Każda interwencja lidera trafia do dziennika w karcie oceny.
   - Błędy samego Fenixa, które wyjdą po drodze, lider naprawia osobno w fenix-agents i też je zapisuje.
5. **Podgląd.** Przed scaleniem lider wystawia PR na kanał podglądowy Firebase (`firebase hosting:channel:deploy <slug>`) i podaje właścicielowi link.
6. **Ocena.** Właściciel testuje podgląd względem planu i wypełnia `docs/oceny/<slug>.md`. Każde kryterium ocenia w skali 1–5, do tego wrażenie ogólne. Wynik trafia też jako komentarz do zadania w HQ.
7. **Scalenie.** Po ocenie, na słowo właściciela. Wdrożenie na fenix-kalkulatory.web.app jest osobnym krokiem.

## Skala ocen

- **5:** działa zgodnie z planem, bez uwag.
- **4:** działa, drobne uwagi (wygląd, tekst).
- **3:** działa częściowo albo z błędem przy części przykładów.
- **2:** jest, ale wynik niezgodny z planem.
- **1:** brak albo nie działa.
