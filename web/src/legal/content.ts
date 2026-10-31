// Dokumenty prawne serwisu (PL / EN). Dane administratora pochodzą ze zmiennych
// środowiskowych VITE_LEGAL_OWNER i VITE_LEGAL_CONTACT (Vercel → Settings → Environment Variables).
import { BUNDLED_CATALOG } from '../data/store'

export type LegalDoc = 'privacy' | 'terms' | 'notices'

export interface LegalSection {
  title: string
  body: string[]
}

const OWNER = (import.meta.env.VITE_LEGAL_OWNER as string | undefined)?.trim()
const CONTACT = (import.meta.env.VITE_LEGAL_CONTACT as string | undefined)?.trim()
export const UPDATED = '31.10.2026'

const brands = [...new Set(BUNDLED_CATALOG.map((b) => b.brand))].sort((a, b) => a.localeCompare(b))
const photos = BUNDLED_CATALOG.filter((b) => b.image_url).map((b) => `${b.brand} ${b.model}: ${b.image_credit ?? 'Wikimedia Commons'} — ${b.image_source ?? ''}`)

const owner = (lang: 'pl' | 'en') =>
  OWNER ?? (lang === 'pl' ? 'osoba fizyczna prowadząca serwis e-bike progress (dane w trakcie uzupełniania)' : 'the private individual running e-bike progress (details being completed)')
const contact = (lang: 'pl' | 'en') =>
  CONTACT ? CONTACT : lang === 'pl' ? 'adres e-mail administratora (w trakcie uzupełniania)' : "the administrator's e-mail address (being completed)"

export function legalContent(lang: 'pl' | 'en'): Record<LegalDoc, { title: string; sections: LegalSection[] }> {
  if (lang === 'en') return en()
  return {
    privacy: {
      title: 'Polityka prywatności',
      sections: [
        { title: '1. Administrator danych', body: [`Administratorem danych osobowych jest ${owner('pl')}. Kontakt w sprawach danych osobowych: ${contact('pl')}.`] },
        {
          title: '2. Jakie dane przetwarzamy',
          body: [
            'Konto: adres e-mail i hasło (hasło przechowywane wyłącznie w postaci skrótu przez dostawcę uwierzytelniania), opcjonalnie identyfikator Apple przy logowaniu przez Apple.',
            'Profil: imię, które sam(a) podajesz.',
            'Dane aplikacji: cele (nazwy e-bike\'ów, kwoty), wpłaty (kwota, data, notatka) oraz zdjęcia lub linki do zdjęć, które dodajesz.',
            'Dane techniczne: adres IP i podstawowe informacje o przeglądarce w logach serwerów dostawców hostingu (bezpieczeństwo i diagnostyka).',
            'Nie zbieramy danych płatniczych – aplikacja nie obsługuje płatności, kwoty wpisujesz sam(a).',
          ],
        },
        {
          title: '3. Cele i podstawy prawne',
          body: [
            'Prowadzenie konta i świadczenie usługi (synchronizacja między iPhonem, zegarkiem i przeglądarką) – art. 6 ust. 1 lit. b RODO.',
            'Bezpieczeństwo, zapobieganie nadużyciom i obsługa zgłoszeń – prawnie uzasadniony interes administratora, art. 6 ust. 1 lit. f RODO.',
          ],
        },
        {
          title: '4. Odbiorcy danych (podmioty przetwarzające)',
          body: [
            'Supabase Inc. – baza danych, uwierzytelnianie i przechowywanie zdjęć; dane przechowywane w regionie UE (Frankfurt, Niemcy).',
            'Vercel Inc. – hosting strony; może przetwarzać adres IP także w USA na podstawie EU-US Data Privacy Framework lub standardowych klauzul umownych.',
            'Apple Inc. – tylko jeśli wybierzesz „Zaloguj się przez Apple”.',
            'Wikimedia Foundation – przeglądarka pobiera z jej serwerów zdjęcia części modeli z katalogu (przekazywany jest wtedy adres IP).',
            'Nie sprzedajemy danych i nie udostępniamy ich w celach marketingowych.',
          ],
        },
        { title: '5. Okres przechowywania', body: ['Dane konta i aplikacji przechowujemy do czasu usunięcia konta. Logi techniczne dostawców – zgodnie z ich politykami (zwykle do kilkudziesięciu dni).'] },
        {
          title: '6. Twoje prawa',
          body: [
            'Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu.',
            'Kopię wszystkich danych pobierzesz w Ustawienia → Konto → „Pobierz moje dane”. Konto i wszystkie dane trwale usuniesz w Ustawienia → Konto → „Usuń konto”.',
            'Przysługuje Ci skarga do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).',
          ],
        },
        { title: '7. Dobrowolność', body: ['Podanie danych jest dobrowolne, ale bez adresu e-mail nie da się założyć konta. Z aplikacji można korzystać bez konta – dane zostają wtedy tylko w Twojej przeglądarce.'] },
        {
          title: '8. Pliki cookies i pamięć przeglądarki',
          body: [
            'Serwis używa wyłącznie niezbędnej pamięci przeglądarki (localStorage): sesja logowania, wybrany język i motyw, dane trybu bez konta. Nie używamy cookies reklamowych ani analitycznych i nie śledzimy Cię między stronami.',
            'Fonty są dostarczane z naszego serwera – nie łączymy się z Google Fonts.',
          ],
        },
        { title: '9. Bezpieczeństwo', body: ['Połączenia są szyfrowane (HTTPS). Dostęp do danych w bazie ogranicza mechanizm Row Level Security – każdy użytkownik widzi tylko swoje dane. Zdjęcia trafiają do prywatnego magazynu dostępnego tylko dla właściciela.'] },
        { title: '10. Zmiany', body: [`Polityka może być aktualizowana; aktualna wersja jest zawsze dostępna w serwisie. Ostatnia aktualizacja: ${UPDATED}.`] },
      ],
    },
    terms: {
      title: 'Regulamin',
      sections: [
        { title: '1. Postanowienia ogólne', body: ['Regulamin dotyczy serwisu e-bike progress: strony internetowej oraz aplikacji na iPhone i Apple Watch.', `Usługodawca: ${owner('pl')}. Kontakt: ${contact('pl')}.`, 'Serwis jest bezpłatnym, niekomercyjnym narzędziem do planowania oszczędności na rower elektryczny.'] },
        {
          title: '2. Czym serwis nie jest',
          body: [
            'Serwis nie jest bankiem, instytucją płatniczą ani doradcą finansowym. Nie przechowuje pieniędzy i nie realizuje płatności – kwoty wpłat wpisujesz samodzielnie.',
            'Serwis nie sprzedaje pojazdów i nie pośredniczy w sprzedaży.',
          ],
        },
        { title: '3. Wymagania techniczne', body: ['Aktualna przeglądarka internetowa z włączonym JavaScriptem; aplikacje mobilne wymagają iOS 26 / watchOS 26.'] },
        { title: '4. Konto', body: ['Konto zakładasz, podając imię, e-mail i hasło (lub logując się przez Apple). Możesz je usunąć w każdej chwili w ustawieniach – usunięcie jest trwałe.'] },
        {
          title: '5. Treści dodawane przez użytkownika',
          body: [
            'Odpowiadasz za zdjęcia, linki i notatki, które dodajesz. Nie dodawaj treści naruszających prawo ani cudzych praw (w tym autorskich i do wizerunku).',
            'Zdjęcia dodane „z linku” są widoczne tylko na Twoim koncie i służą do Twojego prywatnego użytku. Administrator może usunąć treści naruszające prawo po otrzymaniu zgłoszenia.',
          ],
        },
        {
          title: '6. Katalog, ceny i prognozy',
          body: [
            'Katalog e-bike\'ów ma charakter wyłącznie informacyjny. Podane ceny są orientacyjne (na podstawie publicznie dostępnych ofert lub przeliczeń z innych walut), mogą być nieaktualne i nie stanowią oferty w rozumieniu art. 66 Kodeksu cywilnego.',
            'Prognozowana data osiągnięcia celu jest szacunkiem matematycznym na podstawie Twoich wpłat i nie jest gwarancją.',
          ],
        },
        { title: '7. Znaki towarowe', body: ['Nazwy marek i modeli pojazdów są znakami towarowymi ich właścicieli i zostały użyte wyłącznie w celu identyfikacji produktów. Serwis nie jest powiązany z producentami, nie jest przez nich sponsorowany ani zatwierdzony.'] },
        {
          title: '8. Odpowiedzialność',
          body: [
            'Serwis jest udostępniany w obecnej postaci, bez gwarancji nieprzerwanego działania. Dokładamy starań o poprawność danych i ich bezpieczeństwo, zalecamy jednak samodzielne zachowywanie kopii (eksport danych).',
            'Postanowienia regulaminu nie wyłączają ani nie ograniczają praw przysługujących konsumentom na podstawie bezwzględnie obowiązujących przepisów.',
          ],
        },
        { title: '9. Reklamacje i zgłoszenia', body: [`Zgłoszenia (w tym dotyczące naruszeń prawa) przesyłaj na: ${contact('pl')}. Odpowiadamy w ciągu 14 dni.`] },
        { title: '10. Postanowienia końcowe', body: ['Do regulaminu stosuje się prawo polskie. Regulamin może się zmienić – o istotnych zmianach poinformujemy w serwisie.', `Ostatnia aktualizacja: ${UPDATED}.`] },
      ],
    },
    notices: {
      title: 'Informacje prawne',
      sections: [
        {
          title: 'Znaki towarowe',
          body: [
            `${brands.join(', ')} – nazwy i oznaczenia są własnością odpowiednich podmiotów. Apple, iPhone i Apple Watch są znakami towarowymi Apple Inc.`,
            'e-bike progress to niezależny projekt prywatny, niepowiązany z żadnym z producentów. Ilustracje pojazdów w katalogu są własnymi, uproszczonymi grafikami, a nie zdjęciami producentów.',
          ],
        },
        { title: 'Ceny', body: ['Ceny w katalogu są orientacyjne (polskie ogłoszenia dealerów; przy ich braku przeliczenia z EUR/USD z VAT, stan na X 2026). Nie są ofertą handlową. Przed zakupem sprawdź aktualną cenę u autoryzowanego sprzedawcy.'] },
        {
          title: 'Zdjęcia w katalogu',
          body: [
            'W katalogu używamy wyłącznie zdjęć na wolnych licencjach z Wikimedia Commons – autor i link do strony z licencją są podane przy każdym zdjęciu:',
            ...photos,
            'Zdjęcia dodawane przez użytkowników są prywatne i widoczne tylko na ich kontach.',
          ],
        },
        {
          title: 'Fonty i oprogramowanie',
          body: [
            'Big Shoulders Display i Inter Tight – SIL Open Font License 1.1.',
            'React, Vite, Recharts, i18next, Supabase JS – licencja MIT. Kod źródłowy wykorzystuje biblioteki open source zgodnie z ich licencjami.',
          ],
        },
      ],
    },
  }
}

function en(): Record<LegalDoc, { title: string; sections: LegalSection[] }> {
  return {
    privacy: {
      title: 'Privacy policy',
      sections: [
        { title: '1. Data controller', body: [`The controller of your personal data is ${owner('en')}. Contact: ${contact('en')}.`] },
        { title: '2. Data we process', body: ['Account: e-mail and password (stored only as a hash by the authentication provider), optionally your Apple ID identifier.', 'Profile: the name you provide.', 'App data: goals, deposits (amount, date, note) and photos or photo links you add.', 'Technical data: IP address and basic browser data in hosting providers\' server logs.', 'We do not collect payment data – the app does not process payments.'] },
        { title: '3. Purposes and legal bases', body: ['Providing the service and your account – Art. 6(1)(b) GDPR.', 'Security and handling requests – legitimate interest, Art. 6(1)(f) GDPR.'] },
        { title: '4. Recipients (processors)', body: ['Supabase Inc. – database, authentication and photo storage, hosted in the EU (Frankfurt).', 'Vercel Inc. – website hosting; may process IP addresses in the USA under the EU-US Data Privacy Framework or standard contractual clauses.', 'Apple Inc. – only if you use Sign in with Apple.', 'Wikimedia Foundation – your browser loads some catalog photos from its servers.', 'We never sell your data or share it for marketing.'] },
        { title: '5. Retention', body: ['Until you delete your account. Provider logs follow their own policies.'] },
        { title: '6. Your rights', body: ['Access, rectification, erasure, restriction, portability and objection.', 'Download a copy of your data in Settings → Account → "Download my data". Delete your account permanently in Settings → Account → "Delete account".', 'You may lodge a complaint with the Polish supervisory authority (UODO, Stawki 2, 00-193 Warsaw) or your local authority.'] },
        { title: '7. Cookies and browser storage', body: ['Only strictly necessary browser storage is used (session, language, theme, local-mode data). No advertising or analytics cookies, no cross-site tracking. Fonts are self-hosted.'] },
        { title: '8. Security', body: ['HTTPS everywhere, Row Level Security in the database, private photo storage.'] },
        { title: '9. Changes', body: [`Last updated: ${UPDATED}.`] },
      ],
    },
    terms: {
      title: 'Terms of use',
      sections: [
        { title: '1. General', body: [`Service provider: ${owner('en')}. Contact: ${contact('en')}.`, 'e-bike progress is a free, non-commercial savings planner (website, iPhone and Apple Watch apps).'] },
        { title: '2. What the service is not', body: ['Not a bank, payment institution or financial adviser. It holds no money and makes no payments. It does not sell vehicles.'] },
        { title: '3. Account', body: ['You can delete your account at any time in Settings; deletion is permanent.'] },
        { title: '4. Your content', body: ['You are responsible for photos, links and notes you add. Do not add unlawful content or content infringing others\' rights. Photos added from links are private to your account.'] },
        { title: '5. Catalog, prices and forecasts', body: ['The catalog is informational only. Prices are approximate, may be outdated and are not an offer. Forecast dates are estimates, not guarantees.'] },
        { title: '6. Trademarks', body: ['Brand and model names belong to their owners and are used only to identify products. We are not affiliated with, sponsored or endorsed by any manufacturer.'] },
        { title: '7. Liability', body: ['Provided "as is" without a guarantee of uninterrupted availability. Nothing here limits mandatory consumer rights.'] },
        { title: '8. Governing law', body: [`Polish law applies. Last updated: ${UPDATED}.`] },
      ],
    },
    notices: {
      title: 'Legal notices',
      sections: [
        { title: 'Trademarks', body: [`${brands.join(', ')} – names and marks belong to their respective owners. Apple, iPhone and Apple Watch are trademarks of Apple Inc. This is an independent project; vehicle illustrations are our own simplified graphics.`] },
        { title: 'Prices', body: ['Approximate prices (Polish dealer listings, otherwise converted from EUR/USD incl. VAT, Oct 2026). Not an offer.'] },
        { title: 'Catalog photos', body: ['Only freely licensed photos from Wikimedia Commons, credited with author and license page:', ...photos] },
        { title: 'Fonts and software', body: ['Big Shoulders Display and Inter Tight – SIL Open Font License 1.1. React, Vite, Recharts, i18next, Supabase JS – MIT license.'] },
      ],
    },
  }
}
