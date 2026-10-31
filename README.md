# e-bike progress 🚲⚡

Aplikacja do odkładania pieniędzy na rower elektryczny w trzech wersjach:
**iPhone**, **Apple Watch** i **web (komputer / PWA)**. Domyślny, główny cel to
**e-ride pro SR za 30 000 zł**, ale możesz dodać dowolny własny e-bike.

Styl: na iPhonie i zegarku **Liquid Glass** – natywny w iOS 26 / watchOS 26
(`.glassEffect()`, `GlassEffectContainer`, `.buttonStyle(.glass)`). Web jest
**minimalistyczny**: boczne menu na tle strony (na telefonie górny pasek i menu
na cały ekran), czarno-szare elementy, font Geist, liczby tabelaryczne. Jedyny kolor
to barwa marki wybranego e-bike'a – tylko na danych (pasek postępu i linia oszczędności),
przyciemniona tak, by miała kontrast min. 3:1.
Web ma też wypłaty (zapisywane jako ujemne kwoty), kadrowanie zdjęcia przeciąganiem
(kolumna `goals.photo_position`, CSS `object-position`) i ciche dźwięki z Web Audio
(wyłączane w Ustawieniach). Pod paskiem postępu „drabinka cen”:
tańsze modele tej samej marki. Jasny i ciemny motyw.

```
/ios          projekt Xcode
  EBikeProgress/          aplikacja iOS (SwiftUI, MVVM, SwiftData, Supabase)
  EBikeProgressWatch/     aplikacja watchOS (WatchConnectivity)
  EBikeProgressWidgets/   komplikacja Apple Watch (WidgetKit)
  EBikeProgressPhoneWidgets/ widżety iPhone'a: ekran blokady, ekran początkowy, Mac (WidgetKit)
  Shared/                 wspólne: statystyki, formatowanie PLN, tłumaczenia, payload zegarka
  Config/                 xcconfig, Info.plist, entitlements (Secrets.xcconfig poza repo)
/web          Vite + React + TypeScript + Supabase JS + i18next (PWA), wykresy SVG bez zależności
/supabase     migracje SQL: tabele, RLS, domyślny cel SR, Storage, Realtime
```

## Funkcje

| | iPhone | Web | Apple Watch |
|---|---|---|---|
| Postęp celu (zdjęcie, uzbierane, pozostało, %, pasek / pierścień) | ✅ | ✅ | ✅ pierścień |
| Dodawanie wpłat (kwota, data, notatka) | ✅ | ✅ | ✅ Digital Crown / szybkie przyciski, data = dziś |
| Historia od najnowszej, edycja, usuwanie | ✅ | ✅ | ostatnie wpłaty |
| Statystyki: średnia, suma w miesiącu, prognoza, wykres | ✅ Swift Charts | ✅ SVG (`src/lib/charts.js`) | – |
| Własne cele: nazwa, cena, zdjęcie, cel główny | ✅ | ✅ | główny cel |
| Zdjęcia: galeria, aparat (iPhone), drag & drop (web), kompresja | ✅ | ✅ | miniatura |
| Język PL / EN bez restartu, motyw jasny / ciemny / systemowy | ✅ | ✅ | język z iPhone'a |
| Synchronizacja | Supabase + SwiftData offline | Supabase + Realtime | przez iPhone'a |
| Komplikacja z % postępu | | | ✅ |
| Widżet: ekran blokady (jak „Baterie”), ekran początkowy, biurko Maca | ✅ | | |

Format kwot zawsze polski: **12 500,00 zł** (PLN).

**Wersja web na żywo:** <https://e-bike-progress.vercel.app> (Vercel, automatyczne
wdrożenie po każdym pushu na `main`; backend: projekt Supabase `e-bike-progress`, Frankfurt).

---

## 1. Konfiguracja Supabase (darmowy plan)

1. Załóż konto na <https://supabase.com> → **New project** (region np. *Central EU (Frankfurt)*), zapisz hasło do bazy.
2. **SQL Editor** → wklej i uruchom (**Run**) po kolei pliki z `supabase/migrations/`:
   1. `20261031000001_init_schema.sql` – tabele `goals` i `deposits`, triggery
   2. `20261031000002_rls_policies.sql` – Row Level Security (każdy widzi tylko swoje dane)
   3. `20261031000003_default_goal_and_rpc.sql` – cel „e-ride pro SR” 30 000 zł dla każdego nowego konta
   4. `20261031000004_storage.sql` – prywatny bucket `goal-photos` + polityki
   5. `20261031000005_realtime.sql` – Realtime (web od razu widzi zmiany z iPhone'a)
   6. `20261031000006_harden_functions.sql` – utwardzenie funkcji (Security Advisor)
   7. `20261031000007_profiles_catalog_config.sql` – profile (imię), katalog e-bike'ów, `app_config`
   8. `20261031000008_seed_bike_catalog.sql` – pierwsza wersja katalogu
   9. `20261031000009_catalog_images.sql` – kolumny na zdjęcia w katalogu
   10. `20261031000010_seed_bike_catalog_v2.sql` – 49 modeli ze zdjęciami (generowane z `catalog/bikes.json`)

   Alternatywnie Supabase CLI: `supabase link --project-ref <ref>` i `supabase db push`.
3. **Project Settings → API**: skopiuj **Project URL** i klucz **anon public**.
   (Klucza `service_role` nigdy nie wklejaj do aplikacji.)
4. **Authentication → Providers → Email**: włączone (domyślnie). Potwierdzanie e-maila
   możesz zostawić – po rejestracji przyjdzie link.
5. **Authentication → URL Configuration**: *Site URL* = adres wersji web
   (np. `https://kubach7.github.io/e-bike-progress/`), w *Redirect URLs* dodaj też
   `http://localhost:5173/**`.
6. *(opcjonalnie)* **Sign in with Apple** – wymaga płatnego Apple Developer Program:
   - <https://developer.apple.com/account/resources> → *Identifiers*: App ID aplikacji
     z włączonym *Sign in with Apple*; dla weba dodatkowo *Services ID* (z domeną
     i Return URL `https://<projekt>.supabase.co/auth/v1/callback`) oraz klucz (*Keys*)
     z *Sign in with Apple*.
   - Supabase → **Authentication → Providers → Apple**: włącz, w *Client IDs* wpisz
     bundle ID aplikacji iOS (np. `com.kubach7.ebikeprogress`) i Services ID weba,
     uzupełnij *Secret Key* wygenerowany z klucza Apple (instrukcja w panelu Supabase).

## 2. Wersja web

```bash
cd web
cp .env.example .env        # uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173
```

Bez pliku `.env` aplikacja działa w **trybie lokalnym** (dane w `localStorage`) –
przydatne do szybkiego podglądu.

Build produkcyjny: `npm run build` (wynik w `web/dist`), podgląd: `npm run preview`.

### Hosting

- **GitHub Pages** (gotowy workflow `.github/workflows/deploy-web.yml`):
  1. GitHub → repo → *Settings → Pages* → *Source*: **GitHub Actions**.
  2. *Settings → Secrets and variables → Actions* → dodaj `VITE_SUPABASE_URL`
     i `VITE_SUPABASE_ANON_KEY`.
  3. Push na `main` (zmiany w `web/`) albo *Actions → Deploy web → Run workflow*.
     Strona: `https://<login>.github.io/e-bike-progress/`.
- **Vercel**: *Import Project* → *Root Directory* `web` → zmienne środowiskowe jak w `.env`
  (`VITE_BASE=/`). Plik `web/vercel.json` jest gotowy.

### Instalacja jako aplikacja (PWA)

Chrome / Edge: ikona „Zainstaluj” na pasku adresu. Safari (macOS 14+): *Plik → Dodaj do Docka*.

## 3. iPhone i Apple Watch

Wymagania: Mac z **Xcode 26+**, iPhone z **iOS 26+**, Apple Watch z **watchOS 26+**
sparowany z tym iPhonem.

### Konfiguracja projektu

```bash
cd ios/Config
cp Secrets.example.xcconfig Secrets.xcconfig
```

W `Secrets.xcconfig` uzupełnij (plik jest w `.gitignore`):

```
SUPABASE_HOST = twoj-projekt.supabase.co      # bez https:// – w xcconfig "//" to komentarz
SUPABASE_ANON_KEY = eyJhbGciOi...
BUNDLE_ID_PREFIX = com.twojenazwisko          # musi być unikalny
DEVELOPMENT_TEAM = ABCDE12345                 # Team ID (Xcode → Settings → Accounts)
```

Otwórz `ios/EBikeProgress.xcodeproj`. Xcode sam pobierze pakiet **supabase-swift**
(Swift Package Manager). Bez `Secrets.xcconfig` aplikacja działa tylko lokalnie.

### Zdjęcie e-ride pro SR w Assets

1. W Xcode otwórz `EBikeProgress/Assets.xcassets` → zestaw **`ride_pro_sr_placeholder`**.
2. Przeciągnij swoje zdjęcie (JPG/PNG, najlepiej ~1600 px szerokości) na slot **1x**
   (lub 2x/3x). Nazwy zestawu nie zmieniaj.
3. Dopóki slot jest pusty, aplikacja pokazuje grafikę zastępczą.
   W aplikacji: *zdjęcie celu → „Użyj sugerowanego zdjęcia”* albo *„Wgraj własne”*.

Na webie: wrzuć zdjęcie do `web/public/` (np. `ride_pro_sr.jpg`) i zmień stałą
`SUGGESTED_PHOTO_SRC` w `web/src/data/store.ts` na tę nazwę – albo po prostu podmień
grafikę `web/public/ride_pro_sr_placeholder.svg`.

### Uruchomienie na iPhonie (podpisywanie kodu, tryb deweloperski)

1. **Xcode → Settings → Accounts** → dodaj swoje Apple ID (wystarczy darmowe konto,
   ale patrz uwagi niżej).
2. W projekcie zaznacz po kolei targety **EBikeProgress**, **EBikeProgressWatch**,
   **EBikeProgressWidgets**, **EBikeProgressPhoneWidgets** → *Signing & Capabilities* → *Automatically manage signing*,
   *Team* = Twój zespół (albo ustaw `DEVELOPMENT_TEAM` w `Secrets.xcconfig`).
3. Podłącz iPhone kablem (lub w tej samej sieci Wi-Fi po pierwszym sparowaniu),
   na telefonie potwierdź **„Ufaj temu komputerowi”**.
4. Włącz **tryb deweloperski** na iPhonie: *Ustawienia → Prywatność i ochrona →
   Tryb dewelopera* → włącz → restart → potwierdź. (Opcja pojawia się po podłączeniu
   telefonu do Xcode.)
5. W Xcode wybierz schemat **EBikeProgress** i swój iPhone jako cel → **Run (⌘R)**.
6. Przy darmowym koncie przy pierwszym uruchomieniu: *Ustawienia → Ogólne →
   VPN i urządzenia zarządzane* → Twój certyfikat deweloperski → **Ufaj**.

### Widżety na iPhonie i Macu

Widżet pokazuje nazwę głównego e-bike'a i ile już zebrane (odświeża się po każdej wpłacie).

- **Ekran blokady**: przytrzymaj ekran blokady → *Dostosuj* → *Ekran blokady* → pole
  widżetów → **e-bike**. Okrągły wariant wygląda jak widżet „Baterie” (ikona e-bike'a
  w pierścieniu postępu), prostokątny pokazuje nazwę, kwotę „zebrane / cena” i pasek.
- **Ekran początkowy (odblokowany)**: przytrzymaj puste miejsce → *Edytuj* → *Dodaj widżet*
  → **e-bike** → mały (pierścień, nazwa, kwota) lub średni (zdjęcie, kwota, ile brakuje).
- **Mac (macOS 14 Sonoma lub nowszy)**: widżety iPhone'a działają na Macu bez osobnej
  aplikacji – Mac i iPhone muszą być na tym samym Apple ID. Na Macu: kliknij biurko
  prawym przyciskiem → *Edytuj widżety* → sekcja **iPhone** → **e-bike** i przeciągnij
  na biurko (lub do Centrum powiadomień). W *Ustawieniach systemowych → Biurko i Dock*
  musi być włączone *Używaj widżetów iPhone'a*.

Widżety czytają stan z App Group (`$(APP_GROUP_ID)`), dlatego target **EBikeProgress**
ma teraz też capability *App Groups*.

### Uruchomienie na Apple Watch

1. Zegarek musi być sparowany z iPhonem, odblokowany i blisko (Wi-Fi/Bluetooth).
2. Włącz **tryb deweloperski na zegarku**: *Ustawienia (na zegarku) → Prywatność
   i ochrona → Tryb dewelopera* (pojawia się po wykryciu zegarka przez Xcode –
   *Window → Devices and Simulators*). Zegarek się zrestartuje.
3. Aplikacja zegarka jest osadzona w aplikacji iOS – po instalacji na iPhonie zainstaluj
   ją w aplikacji **Watch** na iPhonie (*Dostępne aplikacje → Instaluj*) albo uruchom
   bezpośrednio schemat **EBikeProgressWatch** z zegarkiem jako celem.
4. **Komplikacja**: przytrzymaj tarczę → *Edytuj* → *Komplikacje* → **e-bike** → wybierz
   wariant (okrągły z %, narożny, prostokątny, tekstowy).

### Uwagi o kontach Apple

- **Darmowe konto (Personal Team)**: aplikacja działa 7 dni (potem uruchom ponownie z Xcode),
  maks. 3 aplikacje na urządzeniu. Logowanie jest e-mailem i hasłem (Sign in with Apple
  zostało usunięte – darmowe konto go nie obsługuje).
- **Aktualizacje**: gdy w Supabase (`app_config.ios_update.latest_build`) jest wyższy numer niż
  `APP_BUILD` z `Config/Base.xcconfig`, aplikacja pokazuje baner „Dostępna nowa wersja” z instrukcją
  (`git pull` + ▶ w Xcode). Dane, katalog i ceny odświeżają się same.
  Jeśli podpisywanie zgłosi problem z *App Groups* (komplikacja i widżety), usuń tę
  capability – aplikacja zadziała, a widżety pokażą dane przykładowe.
- **Apple Developer Program (99 USD/rok)**: wszystkie funkcje, w tym Sign in with Apple
  i TestFlight.

### Jak działa synchronizacja

- iPhone trzyma dane w **SwiftData** (działa offline). Każda zmiana jest oznaczana
  `needsSync` i wysyłana do Supabase; po odzyskaniu sieci (`NWPathMonitor`)
  oraz po powrocie aplikacji na pierwszy plan aplikacja dosyła zmiany i pobiera nowe
  (przyrostowo po `updated_at`). Usuwanie jest „miękkie” (`deleted_at`), dzięki czemu
  inne urządzenia też się o nim dowiadują.
- Cel SR utworzony offline przed zalogowaniem jest scalany z celem SR z serwera
  (bez duplikatów – `seed_key`).
- **Apple Watch** nie łączy się z backendem: dostaje stan głównego celu z iPhone'a
  przez **WatchConnectivity** (`updateApplicationContext`), a nowe wpłaty odsyła
  (`sendMessage` lub kolejka `transferUserInfo`, gdy iPhone jest nieosiągalny).
- Web korzysta z tej samej bazy, a dzięki **Realtime** od razu widzi zmiany z telefonu.

## Katalog e-bike'ów, imię i aktualizacje

- **Powitanie**: po założeniu konta (z imieniem) lub pierwszym uruchomieniu aplikacja pyta
  o imię i pokazuje katalog **55 modeli z 8 marek** – pełne linie E-Ride Pro (Mini R, Pro-S,
  SS 2.0/2.5/3.0/4.0, SE, SR), Sur-Ron (Hyper Bee, Light Bee X/L1e, Light Bee 2, Ultra Bee HP, Storm Bee), Talaria
  (X3, XXX, Sting MX3/MX4/SX4/MX5/MX5 Pro, Dragon, Komodo), Stark Varg (MX/EX/SM, Alpha, Factory Edition),
  KTM (SX-E 2/3/5, Freeride E), Segway, 79Bike Falcon i Super73 – albo
  **własny e-bike** (sortowanie po marce A–Z lub cenie). Pierwszy wybrany model zostaje celem głównym; gdy nic nie wybierzesz, celem jest e-ride pro SR.
- Ceny są orientacyjne (polskie ogłoszenia, X 2026; gdzie ich brak – przeliczone z EUR/USD)
  i można je zmienić przy dodawaniu.
- **Katalog** jest w `catalog/bikes.json` (wbudowany w web i iOS – działa offline) oraz w tabeli
  `bike_catalog` w Supabase. Aplikacje pobierają go z serwera, więc **nowe modele i ceny pojawiają się
  bez aktualizacji aplikacji**. Po zmianie pliku: `python3 catalog/build.py` (kopiuje do web/iOS
  i generuje SQL).
- **Imię** zmienisz w *Ustawienia → Profil*; nazwę i cenę celu – w edycji celu.
- **Zdjęcia**: katalog zawiera wyłącznie zdjęcia na wolnych licencjach (Wikimedia Commons,
  z podpisem autora – pole `image_url` / `image_credit` w `catalog/bikes.json` i tabeli
  `bike_catalog`); pozostałe modele mają ilustrację w kolorze marki. Każdemu celowi możesz
  wgrać własne zdjęcie, zrobić je aparatem albo podać **link do zdjęcia z internetu**
  (opcja „Z linku” – na własny użytek). Nowe zdjęcie do katalogu dla wszystkich dodasz w Supabase:
  `update bike_catalog set image_url = '…', image_credit = '…' where id = 'talaria-xxx';`
- **Aktualizacje iOS z poziomu aplikacji**: iOS nie pozwala aplikacji podmienić własnego kodu,
  więc nowe wersje dystrybuuje się przez **TestFlight** (wymaga Apple Developer Program).
  Aplikacja sama sprawdza `app_config.ios_update` w Supabase i pokazuje szklany baner
  „Dostępna nowa wersja” z przyciskiem otwierającym TestFlight. Po wysłaniu nowego buildu
  do TestFlight ustaw w Supabase:
  ```sql
  update public.app_config
     set value = jsonb_set(jsonb_set(value, '{latest_build}', '2'), '{url}', '"https://testflight.apple.com/join/XXXXXXX"')
   where key = 'ios_update';
  ```
  Aplikacja na Apple Watch aktualizuje się automatycznie razem z aplikacją na iPhonie.
  Wersja web (PWA) aktualizuje się sama po każdym wdrożeniu na Vercel.

## Kwestie prawne

Strona zawiera **Politykę prywatności (RODO)**, **Regulamin** i **Informacje prawne** (znaki towarowe,
charakter cen, licencje zdjęć i fontów) – stopka i *Ustawienia → Konto*, linki `#prywatnosc`,
`#regulamin`, `#informacje` (tekst w `web/src/legal/content.ts`). Użytkownik może **pobrać swoje dane**
(JSON) i **usunąć konto** (funkcja `delete_my_account` + usunięcie zdjęć ze Storage) – także w aplikacji iOS,
czego wymaga App Store przy logowaniu przez konto.

Dane administratora ustaw w Vercel → *Settings → Environment Variables*: `VITE_LEGAL_OWNER`
(imię i nazwisko) i `VITE_LEGAL_CONTACT` (e-mail kontaktowy), a potem *Redeploy*.
Dokumenty to rzetelny szablon, nie porada prawna.

## Architektura iOS (MVVM)

- **Model**: `Goal`, `Deposit` (`@Model`, SwiftData) – `ios/EBikeProgress/Models`
- **ViewModel**: `GoalsViewModel`, `DepositFormViewModel`, `GoalEditorViewModel`,
  `StatsViewModel`, `SettingsViewModel`, `AuthViewModel`, `WatchViewModel`
- **Usługi**: `GoalRepository` (SwiftData), `SyncService` (Supabase),
  `PhoneConnectivity` / `WatchConnectivityManager`, `ImageProcessor`, `NetworkMonitor`
- **Shared**: `SavingsStats` (średnia, suma w miesiącu, prognoza – ta sama logika co
  `web/src/lib/stats.ts`), `Money` (format PLN), `L10n` + `Localizable.xcstrings`

Język zmienia się od razu: wybór w `@AppStorage("appLanguage")`, teksty z
`Localizable.xcstrings` pobierane z odpowiedniego `.lproj`, a widoki przebudowywane
przez `.id(language)`.

## Bezpieczeństwo

- Klucze Supabase są tylko w `web/.env` i `ios/Config/Secrets.xcconfig` (oba w `.gitignore`);
  w repo są wyłącznie pliki `*.example`.
- Klucz *anon* jest publiczny z założenia – dane chroni **Row Level Security**
  (`auth.uid() = user_id`) oraz polityki Storage (folder `<user_id>/`).
