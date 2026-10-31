import Foundation
import Observation
import Supabase

/// Sprawdza w Supabase (`app_config.ios_update`), czy jest nowsza wersja aplikacji.
/// iOS nie pozwala aplikacji podmienić własnego kodu – aktualizacja otwiera
/// TestFlight / App Store (adres w `url`). Treści (katalog, ceny) odświeżają się same.
@Observable
@MainActor
final class UpdateChecker {
    private(set) var latestBuild: Int?
    private(set) var updateURL: URL?
    private(set) var notes: String?
    private(set) var isChecking = false
    private(set) var lastChecked: Date?

    private let client: SupabaseClient?

    private struct ConfigRow: Decodable {
        let value: Value
        struct Value: Decodable {
            let latest_build: Int?
            let url: String?
            let notes_pl: String?
            let notes_en: String?
        }
    }

    init(client: SupabaseClient? = SupabaseConfig.client) {
        self.client = client
    }

    /// Numer kompilacji zainstalowanej aplikacji (CFBundleVersion).
    var currentBuild: Int {
        Int(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") ?? 0
    }

    var isUpdateAvailable: Bool {
        guard let latestBuild else { return false }
        return latestBuild > currentBuild
    }

    func check() async {
        guard let client, !isChecking else { return }
        isChecking = true
        defer {
            isChecking = false
            lastChecked = .now
        }
        do {
            let rows: [ConfigRow] = try await client.from("app_config").select("value").eq("key", value: "ios_update").execute().value
            guard let value = rows.first?.value else { return }
            latestBuild = value.latest_build
            updateURL = value.url.flatMap(URL.init(string:))
            notes = L10n.current == .en ? value.notes_en : value.notes_pl
        } catch {
            print("Update check error: \(error)")
        }
    }
}
