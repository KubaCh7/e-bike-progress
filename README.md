# e-bike progress 🚲⚡

Aplikacja do odkładania pieniędzy na rower elektryczny w trzech wersjach:
**iPhone**, **Apple Watch** i **web (komputer / PWA)**. Domyślny, główny cel to
**e-ride pro SR za 30 000 zł**, ale możesz dodać dowolny własny e-bike.

Styl: **Liquid Glass** – natywny w iOS 26 / watchOS 26 (`.glassEffect()`,
`GlassEffectContainer`, `.buttonStyle(.glass)`, morphing przycisków) i odtworzony
w CSS na webie (`backdrop-filter: blur() saturate()`, półprzezroczyste warstwy,
jasna ramka z połyskiem, rozmyte kolorowe tło, fallback bez blur). Jasny i ciemny motyw.

```
/ios          projekt Xcode
  EBikeProgress/          aplikacja iOS (SwiftUI, MVVM, SwiftData, Supabase)
  EBikeProgressWatch/     aplikacja watchOS (WatchConnectivity)
  EBikeProgressWidgets/   komplikacja (WidgetKit)
  Shared/                 wspólne: statystyki, formatowanie PLN, tłumaczenia, payload zegarka
  Config/                 xcconfig, Info.plist, entitlements (Secrets.xcconfig poza repo)
/web          Vite + React + TypeScript + Supabase JS + Recharts + i18next (PWA)
/supabase     migracje SQL: tabele, RLS, domyślny cel SR, Storage, Realtime
```

## Funkcje

| | iPhone | Web | Apple Watch |
|---|---|---|---|
| Postęp celu (zdjęcie, uzbierane, pozostało, %, pasek / pierścień) | ✅ | ✅ | ✅ pierścień |
| Dodawanie wpłat (kwota, data, notatka) | ✅ | ✅ | ✅ Digital Crown / szybkie przyciski, data = dziś |
| Historia od najnowszej, edycja, usuwanie | ✅ | ✅ | ostatnie wpłaty |
| Statystyki: średnia, suma w miesiącu, prognoza, wykres | ✅ Swift Charts | ✅ Recharts | – |
| Własne cele: nazwa, cena, zdjęcie, cel główny | ✅ | ✅ | główny cel |
| Zdjęcia: galeria, aparat (iPhone), drag & drop (web), kompresja | ✅ | ✅ | miniatura |
| Język PL / EN bez restartu, motyw jasny / ciemny / systemowy | ✅ | ✅ | język z iPhone'a |
| Synchronizacja | Supabase + SwiftData offline | Supabase + Realtime | przez iPhone'a |
| Komplikacja z % postępu | | | ✅ |

Format kwot zawsze polski: **12 500,00 zł** (PLN).

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
   **EBikeProgressWidgets** → *Signing & Capabilities* → *Automatically manage signing*,
   *Team* = Twój zespół (albo ustaw `DEVELOPMENT_TEAM` w `Secrets.xcconfig`).
3. Podłącz iPhone kablem (lub w tej samej sieci Wi-Fi po pierwszym sparowaniu),
   na telefonie potwierdź **„Ufaj temu komputerowi”**.
4. Włącz **tryb deweloperski** na iPhonie: *Ustawienia → Prywatność i ochrona →
   Tryb dewelopera* → włącz → restart → potwierdź. (Opcja pojawia się po podłączeniu
   telefonu do Xcode.)
5. W Xcode wybierz schemat **EBikeProgress** i swój iPhone jako cel → **Run (⌘R)**.
6. Przy darmowym koncie przy pierwszym uruchomieniu: *Ustawienia → Ogólne →
   VPN i urządzenia zarządzane* → Twój certyfikat deweloperski → **Ufaj**.

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
  maks. 3 aplikacje na urządzeniu. **Sign in with Apple nie jest dostępne** – usuń
  capability *Sign in with Apple* w targecie EBikeProgress (lub plik
  `Config/EBikeProgress.entitlements`) i loguj się e-mailem.
  Jeśli podpisywanie zgłosi problem z *App Groups* (komplikacja), usuń tę capability
  z targetów zegarka – aplikacja zadziała, a komplikacja pokaże dane przykładowe.
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
