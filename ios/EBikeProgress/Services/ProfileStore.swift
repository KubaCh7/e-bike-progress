import Foundation
import Observation
import Supabase

/// Profil użytkownika: imię i informacja, czy przeszedł powitanie (wybór e-bike'ów).
/// Zapisywany lokalnie (działa offline) i w tabeli `profiles` w Supabase.
@Observable
@MainActor
final class ProfileStore {
    private(set) var displayName: String?
    private(set) var onboarded: Bool
    /// Profil wczytany dla bieżącego konta (do tego czasu nie pokazujemy powitania).
    private(set) var isLoaded = false

    private let client: SupabaseClient?
    @ObservationIgnored private var userID: UUID?

    private struct ProfileRow: Codable {
        let id: UUID
        var displayName: String?
        var onboarded: Bool?

        enum CodingKeys: String, CodingKey {
            case id
            case displayName = "display_name"
            case onboarded
        }
    }

    init(client: SupabaseClient? = SupabaseConfig.client) {
        self.client = client
        displayName = UserDefaults.standard.string(forKey: Self.key("name", nil))
        onboarded = UserDefaults.standard.bool(forKey: Self.key("onboarded", nil))
    }

    private static func key(_ name: String, _ user: UUID?) -> String {
        "profile.\(user?.uuidString.lowercased() ?? "local").\(name)"
    }

    /// Przełącza profil na zalogowanego użytkownika (lub lokalny) i pobiera dane z serwera.
    func activate(userID: UUID?, hasGoals: Bool) async {
        self.userID = userID
        displayName = UserDefaults.standard.string(forKey: Self.key("name", userID))
        onboarded = UserDefaults.standard.bool(forKey: Self.key("onboarded", userID)) || (userID == nil && hasGoals)
        defer { isLoaded = true }
        guard let client, let userID else { return }
        do {
            let rows: [ProfileRow] = try await client.from("profiles").select().eq("id", value: userID.uuidString).execute().value
            if let row = rows.first {
                if let name = row.displayName, !name.isEmpty { setLocal(name: name) }
                if row.onboarded == true { setLocal(onboarded: true) }
            }
        } catch {
            print("Profile fetch error: \(error)")
        }
    }

    func setName(_ name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        setLocal(name: trimmed)
        await push(ProfileRow(id: userID ?? UUID(), displayName: trimmed, onboarded: nil))
    }

    func completeOnboarding() async {
        setLocal(onboarded: true)
        await push(ProfileRow(id: userID ?? UUID(), displayName: nil, onboarded: true))
    }

    private func setLocal(name: String? = nil, onboarded: Bool? = nil) {
        if let name {
            displayName = name
            UserDefaults.standard.set(name, forKey: Self.key("name", userID))
        }
        if let onboarded {
            self.onboarded = onboarded
            UserDefaults.standard.set(onboarded, forKey: Self.key("onboarded", userID))
        }
    }

    private func push(_ row: ProfileRow) async {
        guard let client, userID != nil else { return }
        do {
            try await client.from("profiles").upsert(row).execute()
            if let name = row.displayName {
                _ = try await client.auth.update(user: UserAttributes(data: ["display_name": .string(name)]))
            }
        } catch {
            // offline – lokalnie zapisane, wyślemy przy kolejnej zmianie
            print("Profile push error: \(error)")
        }
    }
}
