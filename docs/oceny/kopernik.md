# Ocena: kalkulator Kopernika

Plan: [docs/plany/kopernik.md](../plany/kopernik.md). Zadanie HQ: FOC-1828. PR: joint-hubs/fenix-kalkulatory#8 (commit 88d3fc84). Podgląd: https://fenix-kalkulatory--kopernik-pngktjr5.web.app/kopernik/ (ważny do 8.12.2026).

## Ocena właściciela

| # | Kryterium | Ocena (1 do 5) | Uwagi |
|---|-----------|-----------|-------|
| K1 | Wybór planety i daty | | |
| K2 | Długość ekliptyczna i znak zodiaku | | |
| K3 | Odległość w j.a. i km | | |
| K4 | Czas biegu światła | | |
| K5 | Ruch wsteczny | | |
| K6 | Model kołowy i różnica | | |
| K7 | Kalendarz juliański i gregoriański | | |
| K8 | Komunikaty dla złych dat | | |
| K9 | Wygląd, język, brak sieci | | |
| | **Wrażenie ogólne** | | |

## Przebieg (uzupełnia lider)

- Maszyna: fenix-mamut, Fenix main 8fe9da8. Start 24.11 16:00 UTC, PR o 19:59 UTC (około 4 h, z czego około 1 h stania na oknie zgody).
- Triage: dev, medium, przebieg dev -> test.
- Koszt: około 1,43 USD według kokpitu (dev-1 około 1,40, test-2 około 0,03), limit 10 USD.
- Rundy dev -> test: dev-1 dwie tury. Supervisor odrzucił pierwszą, bo kod nie był uruchomiony, i wymusił `npm test` oraz tabelę K2 do K6 z liczbami z kodu. Potem test-2: pass na 88d3fc84, niezależne przeliczenie K2 do K8 (wszystkie w tolerancji), `npm test` 107/107. Testu w kontenerze nie było, bo w środowisku testera brak Dockera.
- Interwencje lidera:
  1. Zatrzymanie zakończonej sesji FOC-1813, która zajmowała miejsce w limicie 2 sesji (porządki przed startem).
  2. Odrzucenie bramki wypchnięcia dev-1 zgłoszonej przed testerem (gate-dev-1-1), z notatką „najpierw tester”.
  3. Odrzucenie okna zgody na ręczne `git push` Supervisora po zgodzie na gate-dev-1-2, z poleceniem zgłoszenia własnej bramki; publikacja przeszła potem sama (gate-supervisor-1).
- Zgody właściciela: pobranie tabel Standisha z ssd.jpl.nasa.gov (okno zgody stało około 36 min, nikt nie dostał powiadomienia).
- Błędy Fenixa wykryte po drodze:
  - FOC-1743: bramka dziecka przed testem przechodziła, bo dziecko nie ma `LA_TASK_KEY`; naprawione w fenix-agents PR 69 (scalone, jeszcze nie na mamut).
  - FOC-1865: zgoda na bramce dziecka nie uruchamia automatycznej publikacji; Supervisor pcha ręcznie i staje na oknie zgody. Także „Waker not running”.
  - Host sesji chwilami nie odpowiada („host-unreachable” w kokpicie).
