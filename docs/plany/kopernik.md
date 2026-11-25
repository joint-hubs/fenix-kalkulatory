# Plan kalkulatora: Mikołaj Kopernik

Wylosowany 24.11.2026 z listy 32 wielkich umysłów (`secrets.choice`). Plan jest stylizacją napisaną głosem Kopernika, nie cytatem.

## List

Frombork, w dzień świętego Urbana, roku Pańskiego 1543.

Przez trzydzieści lat z wieży przy katedrze patrzyłem, jak planety idą po niebie, i liczyłem ich drogi na tablicach, które zajmowały mi całe zimy. Postawiłem Słońce w środku świata i od tego czasu wiem, że Ziemia jest jedną z wędrownych gwiazd. Ale ile wiem naprawdę?

Wiem, w którym znaku zodiaku stanie Mars za rok, jeśli policzę dobrze i nie pomylę się w setce dodawań. Wiem, że Saturn jest dziewięć razy dalej od Słońca niż Ziemia. Nie wiem natomiast, ile to mil, bo nikt nie zmierzył, jak daleko jest Słońce. Nie wiem, jak szybko biegnie światło ani czy w ogóle biegnie. I wiem, że moje koła nie pasują do nieba tak, jak bym chciał: Mars potrafi uciec moim rachubom o kilka stopni, choć nie umiem powiedzieć dlaczego.

Chciałbym zobaczyć liczydło, które w jednej chwili zrobi to, co mnie zajmowało tygodnie, i powie mi to, czego nie mogłem wiedzieć:

1. **Gdzie stoi planeta.** Wybieram jedną z pięciu wędrownych gwiazd, które znam (Merkury, Wenus, Mars, Jowisz, Saturn), i dzień. Liczydło mówi, pod jaką długością na ekliptyce widać ją z Ziemi i w jakim znaku zodiaku to jest.
2. **Jak daleko jest naprawdę.** Odległość od Ziemi w moich miarach (promień drogi Ziemi wokół Słońca) i w waszych kilometrach, których ja poznać nie mogłem.
3. **Jak długo leci jej światło.** Ile minut światło planety potrzebuje, żeby dotrzeć do mojego oka.
4. **Czy cofa się po niebie.** Czy tego dnia planeta idzie ruchem wstecznym. To właśnie ten ruch wytłumaczyłem, stawiając Słońce w środku, więc chcę go widzieć.
5. **O ile mylą się moje koła.** Obok prawdziwego położenia pokaż, gdzie postawiłby planetę mój prosty model: koła wokół Słońca, ruch równy. Napisz, o ile stopni i o ile odległości się różnią. Chcę wiedzieć, jak bardzo się myliłem.
6. **Moje daty.** Ja piszę daty po juliańsku. Papież Grzegorz zmieni kalendarz dopiero po mojej śmierci, w 1582 roku. Dzień sprzed 15 października 1582 roku czytaj więc po juliańsku, a późniejszy po gregoriańsku. Powiedz mi, którego kalendarza użyłeś.

Nie proś mnie o rachunki dla dni, których nie umiesz policzyć dobrze. Jeśli dzień jest poza twoim zakresem, powiedz to wprost.

Mikołaj Kopernik, kanonik warmiński

## Czego oczekuję (kryteria oceny)

Wartości referencyjne pochodzą z JPL Horizons (NASA), obserwator w środku Ziemi, długość ekliptyczna liczona od równonocy daty. Godzina w przykładach: 12:00 UT.

| # | Kryterium | Jak sprawdzić |
|---|-----------|---------------|
| K1 | Wybór planety (Merkury, Wenus, Mars, Jowisz, Saturn) i daty z zakresu 1500 do 2100 | Formularz przyjmuje te dane z klawiatury i myszą, działa na telefonie 390 px |
| K2 | Długość ekliptyczna i znak zodiaku, błąd najwyżej 1° | Mars 27.08.2003: 335,35°, Ryby. Wenus 1.01.2026: 279,84°, Koziorożec. Jowisz 24.11.2026: 146,47°, Lew. Merkury 24.11.2026: 223,17°, Skorpion |
| K3 | Odległość od Ziemi w j.a. i w km, błąd najwyżej 2% | Mars 27.08.2003: 0,3727 j.a., około 55,8 mln km. Jowisz 24.11.2026: 5,134 j.a. Saturn 24.05.1543 (jul.): 9,067 j.a. |
| K4 | Czas biegu światła w minutach, błąd najwyżej 2% | Mars 27.08.2003: około 3,1 min. Saturn 24.05.1543 (jul.): około 75,4 min |
| K5 | Ruch wsteczny tak/nie | Mars 27.08.2003: tak. Saturn 24.05.1543 (jul.): tak. Jowisz, Merkury 24.11.2026 i Wenus 1.01.2026: nie |
| K6 | Model kołowy Kopernika obok wyniku i różnica w stopniach oraz w odległości | Mars 27.08.2003: model kołowy około 333,1° i 0,524 j.a., różnica około 2,3° i około 40% odległości. Saturn 24.05.1543: model około 220,7°, różnica około 4,7° |
| K7 | Kalendarz: daty przed 15.10.1582 po juliańsku, później po gregoriańsku, z informacją, którego użyto | Saturn 24.05.1543 daje wynik z K2/K3 tylko przy kalendarzu juliańskim. Data 10.10.1582 nie istnieje (wypadła przy reformie) i dostaje czytelny komunikat |
| K8 | Data poza zakresem lub pusta: jasny komunikat zamiast liczby | 1499 i 2101: komunikat o zakresie |
| K9 | Strona w stylu reszty kalkulatorów, polski tekst na „ty”, bez sieci w czasie działania | Przegląd strony; zakładka sieci w przeglądarce pusta po załadowaniu |

Model „prawdziwy” może korzystać z przybliżonych elementów orbit (np. tablice Standisha z JPL, wersja na lata 3000 p.n.e. do 3000 n.e.) wpisanych w kod, z poprawką na precesję do równonocy daty. Model kołowy to orbity kołowe o średnich odległościach i średnim ruchu, bez mimośrodów i nachyleń.

## Runda 4: zrozumiałość (po recenzji UX, 25.11)

Po rundzie 3 liczby i przeliczanie działają, ale laik nie wie, co z nich wynika. Recenzja UX dała 4/10. Główne zarzuty: wykres pod wynikiem jest stałym okręgiem bez planety, liczby są bez znaczenia dla laika, a porównanie z kołami Kopernika to sucha tabelka. Kryteria K10 do K12 sprawdzały obecność objaśnień, nie to, czy ktoś je zrozumie. Stąd kryteria, których nie da się spełnić samą obecnością elementu.

| # | Kryterium | Jak sprawdzić |
|---|-----------|---------------|
| K13 | Rysunek z góry pokazuje stan dla wybranej daty: Słońce, orbitę Ziemi i planety, Ziemię i planetę w ich położeniach, linię Ziemia–planeta, pas 12 znaków zodiaku z zaznaczonym znakiem planety, oraz „cień” planety w miejscu, gdzie postawiłby ją model kół | Test strony: położenie kropki planety różni się dla Mars 27.08.2003 i Jowisz 24.11.2026; na rysunku są wszystkie wymienione elementy. Podpis rysunku mówi prawdę o tym, co widać |
| K14 | Nad liczbami jedno zdanie z wynikiem, z nazwą planety, znakiem i kierunkiem ruchu | Mars 27.08.2003: zdanie zawiera „Mars”, „Ryb” i „cofa” |
| K15 | Bez fałszywej precyzji: km jako „mln km” (lub „mld km”) z najwyżej 3 cyframi znaczącymi, stopnie jako położenie w znaku („5° przed końcem Ryb”), pełne stopnie tylko jako szczegół | Mars 27.08.2003: „55,8 mln km” lub „56 mln km”; w wyniku nie ma ciągu 7 lub więcej cyfr |
| K16 | Czas światła z porównaniem do czegoś znanego (światło ze Słońca leci około 8 minut) | Mars 27.08.2003: w tekście jest „3” minuty i odniesienie do Słońca |
| K17 | Objaśnienia widoczne bez najeżdżania myszą i dopasowane do wyniku: przy pojęciu (j.a., długość ekliptyczna, ruch wsteczny, koła Kopernika) przycisk „?” obsługiwany klawiaturą i dotykiem, tekst odnosi się do bieżącej planety i daty | Test strony: po kliknięciu „?” przy ruchu wstecznym dla Marsa 27.08.2003 tekst zawiera „Mars”. Brak objaśnień tylko w atrybucie `title` |
| K18 | Gotowe przykłady jako przyciski, co najmniej 3: „Dziś”, „Wielkie zbliżenie Marsa 2003”, „Saturn w roku mojej śmierci 1543”. Stan po otwarciu strony pasuje do jednego z nich (planeta zgodna z datą) | Test strony: kliknięcie przykładu Mars 2003 ustawia formularz i wynik („Ryb”, ruch wsteczny). Po otwarciu strony wybrany jest Mars, nie Merkury przy dacie Marsa |
| K19 | Koła Kopernika jako jedno zdanie jego głosem: o ile stopni i o ile procent się myli, słowami „dalej” albo „bliżej”, bez znaku minus | Mars 27.08.2003: zdanie zawiera około 40% i „dalej” |
| K20 | Zła data nie kasuje wyniku: poprzedni wynik zostaje przygaszony, przy złym polu komunikat, pole ma `aria-invalid="true"` i `aria-describedby` | Test strony: 31.02 zostawia przygaszony wynik i oznacza pole dnia |
| K21 | Telefon 390×844: po wybraniu przykładu zdanie z wynikiem jest widoczne bez przewijania (formularz może się zwinąć) | Sprawdza lider w przeglądarce; test strony sprawdza, że zdanie z wynikiem stoi w kodzie przed formularzem lub formularz się zwija |
| K22 | Każdy widoczny przycisk coś zmienia, nie ma zdań o obsłudze w rodzaju „Policz powtarza obliczenie” | Test strony: kliknięcie każdego przycisku zmienia stan strony |

Oceny laików (trzy osoby, 30 sekund, „co to za strona?” i „gdzie stał Mars w 2003?”) robi właściciel przy ocenie, to nie jest kryterium dla zespołu.

Fenix nie ma przeglądarki w kontenerze, więc testy strony idą przez symulowany DOM na prawdziwym `index.html` (jak K12b), a widok w prawdziwej przeglądarce i telefon sprawdza lider na podglądzie.
