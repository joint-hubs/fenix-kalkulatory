# Ocena: kalkulator Kopernika

Plan: [docs/plany/kopernik.md](../plany/kopernik.md). Zadanie HQ: FOC-1828. PR: joint-hubs/fenix-kalkulatory#9, scalony 25.11 jako d021439 (ostatni commit 68d61f2; runda 1 była w PR 8, commit 88d3fc84, zamknięty razem z nim). Podgląd: https://fenix-kalkulatory--kopernik-pngktjr5.web.app/kopernik/ (ważny do 9.12.2026).

## Ocena właściciela

| # | Kryterium | Ocena (1 do 5) | Uwagi |
|---|-----------|-----------|-------|
| K1 | Wybór planety i daty | | Zmiana planety nie przelicza wyniku; przycisk „Policz” po zmianie planety też nie przelicza (odtworzone przez lidera: Jowisz, wynik zostaje dla Merkurego). Trzeba zmienić liczbę w dacie, żeby przeliczył. |
| K2 | Długość ekliptyczna i znak zodiaku | | |
| K3 | Odległość w j.a. i km | | |
| K4 | Czas biegu światła | | |
| K5 | Ruch wsteczny | | |
| K6 | Model kołowy i różnica | | |
| K7 | Kalendarz juliański i gregoriański | | |
| K8 | Komunikaty dla złych dat | | |
| K9 | Wygląd, język, brak sieci | | Teksty średnio opisowe, brak pomocy (objaśnień pojęć i wyników). |
| | **Wrażenie ogólne** | **5/10** | „Nie do końca rozumiem ten kalkulator.” Ocena właściciela 24.11 po obejrzeniu podglądu. |

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

## Wnioski po ocenie (lider)

- Obliczenia przeszły niezależne przeliczenie testera, ale strona ma błąd obsługi, którego test nie złapał: tester sprawdzał tylko moduł `calc.js`, nigdy strony w przeglądarce.
- Plan nie miał kryteriów zrozumiałości (objaśnienia, pomoc przy wynikach). Kolejne plany dostają takie kryterium jawnie.

## Runda 2 (po recenzji, 24.11 wieczorem)

- Nowe kryteria K10 (przeliczanie), K11 (objaśnienia dla laika), K12 (testy strony) w HQ.
- Przebieg: dev-1 po wznowieniu zapętlił się na bramkach wypchnięcia starego commitu 88d3fc8 (gate-dev-1-3, -4, -5, wszystkie odrzucone przez lidera); na decyzję lidera Supervisor zatrzymał dev-1 i uruchomił dev-3. dev-3: commit e17b691 (osobny `app.js`, objaśnienia, testy przez symulowany DOM), test-4: pass, `npm test` 121/121. Publikacja otworzyła NOWY PR 9 (gałąź dev-3), a nie zaktualizowała PR 8, choć Supervisor zapowiadał aktualizację PR 8.
- Sprawdzenie lidera w prawdziwej przeglądarce (podgląd): strona nie działa. `index.html` ładuje `app.js`, ale `initKopernik` nigdzie nie jest wywoływane: pusta lista planet, brak wyniku. Testy i tester wołały `initKopernik` same, przez symulowany DOM, więc przeszły. K12 („sprawdza stronę w przeglądarce albo równoważnie”) nie zostało spełnione.
- Interwencje lidera w rundzie 2: odrzucenie trzech bramek zapętlonego dev-1 (4), decyzja „zatrzymaj dev-1 i uruchom świeże dev” na pytanie Supervisora (5), wysłanie tej decyzji przez API hosta, bo kokpit gubił wiadomości do zajętego Supervisora (część 5).
- Koszt rundy 2: do uzupełnienia z kokpitu.

## Runda 3 (24.11 wieczorem do 25.11 w nocy)

- Zlecenie: strona ma startować sama, a test K12b ma ładować `index.html` jak przeglądarka, bez ręcznego wołania `initKopernik`.
- dev-3: commit 40e7ae0 (samodzielny start w `app.js`, test `tests/kopernik.page.test.mjs`). Supervisor przejrzał go i uruchomił testera, ale o 22:32 UTC limit dzienny projektu (10 USD, wydane 10,01) zaparkował sesję przed testem. Komentarz o zatrzymaniu pojawił się w HQ, co potwierdza FOC-1736 na żywo.
- Właściciel podniósł limit do 15 USD. Starej sesji nie dało się wznowić („generation is over”), więc lider uruchomił nową (sup-52bbca2e) z opisem stanu: commit 40e7ae0, brak testera, publikacja do PR 9.
- Nowa sesja: test-1 pass na 40e7ae0, `npm test` 122/122. K12b czerwony na rodzicu (lista planet 0 z 5), zielony na kandydacie. Bramka gate-supervisor-1 celowała tym razem w PR 9 (przesunięcie gałęzi do przodu, bez nowego PR). PR 9 wskazuje 40e7ae0.
- Sprawdzenie lidera w prawdziwej przeglądarce (podgląd, 25.11): strona startuje sama, bez błędów w konsoli. Zmiana planety od razu przelicza wynik (Merkury, Jowisz, Mars). Mars 27.08.2003: 0,37 au, Ryby 335,27°, ruch wsteczny „tak”, zgodnie z wielką opozycją 2003. Data 31.02 daje komunikat „Takiego dnia nie ma w kalendarzu…”.
- Interwencje lidera w rundzie 3: (6) uruchomienie nowej sesji po zatrzymaniu przez limit, z opisem stanu; (7) zgoda „yes” na bramce gate-supervisor-1.
- Koszt: runda 3 przekroczyła limit 10 USD na kalkulator. Większość poszła na samego Supervisora (około 6,5 h pracy, wznowienia i streszczenia kontekstu); dzieci kosztowały około 2 USD.

## Runda 4 (25.11 w nocy): zrozumiałość

- Powód: recenzja UX (agent projektant, 4/10) po niezadowoleniu właściciela. Nowe kryteria K13 do K22 w planie i w HQ (rysunek nieba, zdanie z wynikiem, liczby po ludzku, pomoc bez myszy, gotowe przykłady, koła Kopernika jako zdanie, zła data nie kasuje wyniku, telefon, brak martwych przycisków).
- Przebieg: ta sama sesja Supervisora (sup-52bbca2e). dev-3 wznowiony: commit 68d61f2 (6 plików, +699/-63). test-2: pass, `npm test` 140/140, każde z K13 do K22 czerwone na rodzicu i zielone na kandydacie. Dwa stare sprawdzenia startu zmienione z Merkurego na Marsa (jawnie, wynika z K18).
- Błędy Fenixa (FOC-1876): (1) zapis werdyktu padł na EACCES, bo łańcuch rund sięgał do katalogu verdicts poprzedniego runu z inną grupą; (2) zapisany werdykt rundy 4 nie ma sha kandydata, więc bramka publikacji wzięła kandydata z rundy 3 i odmówiła („branch-moved”), a Supervisor próbował wypchnąć ręcznie.
- Interwencje lidera: (8) odczyt katalogu verdicts runu 5d8c dla grupy fenix i odpowiedź „A” na gate-test-2-1; (9) zgoda „yes” na gate-supervisor-2; (10) odrzucenie okna zgody na ręczny `git push` z notatką; (11) podgląd wystawiony z commita 68d61f2 pobranego z mamut (PR 9 nadal wskazuje 40e7ae0).
- Sprawdzenie lidera w przeglądarce: zdanie z wynikiem jest („Mars stoi w Rybach i cofa się na tle gwiazd”), liczby po ludzku (55,8 mln km, „5° po początku Ryb”, 8 minut światła ze Słońca), przyciski przykładów działają (Saturn 1543: kalendarz juliański, „około 5% bliżej”), przyciski „?” otwierają objaśnienia z nazwą planety i datą, na telefonie 390×844 zdanie z wynikiem jest widoczne bez przewijania. Słabe: rysunek nieba jest mały, Ziemia i Mars z podpisami nachodzą na siebie, pas zodiaku ma podpis tylko przy jednym znaku; objaśnienie ruchu wstecznego dla 1543 kończy się „Dziś: cofa się”.

## Zakończenie (25.11 wieczorem)

- Właściciel: „Zrób PR 9”. Commit 68d61f2 był tylko na mamucie, więc lider przeniósł go paczką `git bundle` i wypchnął na gałąź PR 9 (przesunięcie do przodu z 40e7ae0, bez przepisywania historii).
- Przed wypchnięciem: `npm test` 140/140 na laptopie, brak półpauz i pauz w `public/kopernik/`, strona sprawdzona w przeglądarce przy 390×844 (start bez kliknięcia, przykład Saturna przelicza wynik, rysunek widoczny, konsola bez błędów).
- PR 9 scalony do `main` (d021439), CI zielone. PR 8 zamknięty automatycznie jako scalony. FOC-1828: Done.
- Interwencja lidera: (12) ręczna publikacja zamiast bramki, bo werdykt rundy 4 nie miał sha kandydata. Poprawka tego błędu jest w fenix-agents PR 70 (FOC-1876); mamut jeszcze jej nie ma.
- Uwagi z rundy 4 o rysunku nieba (mały, nachodzące podpisy, jeden podpis na pasie zodiaku) zostają do ewentualnej kolejnej rundy.
- Wniosek: tester bez przeglądarki dwa razy dał „pass” stronie, która nie działała. Stąd FOC-1868 (tester sprawdza stronę w prawdziwej przeglądarce).
