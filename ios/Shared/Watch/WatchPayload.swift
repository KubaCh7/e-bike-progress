import Foundation

/// Wpłata widoczna na zegarku.
struct WatchDeposit: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let amount: Decimal
    let date: Date
    var note: String?
}

/// Stan głównego celu wysyłany z iPhone'a na zegarek (i do komplikacji).
struct WatchSnapshot: Codable, Equatable, Sendable {
    var goalID: UUID?
    var goalName: String
    var target: Decimal
    var saved: Decimal
    /// Mała miniatura zdjęcia (JPEG ~160 px).
    var thumbnail: Data?
    /// Ostatnie wpłaty (od najnowszej).
    var recent: [WatchDeposit]
    /// Identyfikatory wpłat z zegarka, które iPhone już zapisał.
    var processedWatchIDs: [UUID]
    /// Język interfejsu wybrany na iPhonie.
    var language: String
    var updatedAt: Date

    var remaining: Decimal { max(target - saved, 0) }
    var progress: Double { target > 0 ? min(max((saved / target).doubleValue, 0), 1) : 0 }

    static let placeholder = WatchSnapshot(
        goalID: nil,
        goalName: AppConstants.defaultGoalName,
        target: AppConstants.defaultGoalTarget,
        saved: 0,
        thumbnail: nil,
        recent: [],
        processedWatchIDs: [],
        language: AppLanguage.pl.rawValue,
        updatedAt: .distantPast
    )
}

/// Nowa wpłata dodana na zegarku (data = dziś).
struct WatchNewDeposit: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let goalID: UUID?
    let amount: Decimal
    let date: Date
}

/// Klucze słowników WatchConnectivity.
enum WatchMessageKey {
    static let snapshot = "snapshot"
    static let newDeposit = "newDeposit"
    static let requestSnapshot = "requestSnapshot"
}

/// Zapis ostatniego stanu w App Group (zegarek + komplikacja).
enum SnapshotStore {
    private static let key = "watchSnapshot"
    private static let pendingKey = "watchPendingDeposits"

    static func save(_ snapshot: WatchSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        AppConstants.sharedDefaults.set(data, forKey: key)
        AppConstants.sharedDefaults.set(snapshot.language, forKey: L10n.languageKey)
    }

    static func load() -> WatchSnapshot? {
        guard let data = AppConstants.sharedDefaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(WatchSnapshot.self, from: data)
    }

    /// Wpłaty z zegarka, których iPhone jeszcze nie potwierdził.
    static func savePending(_ deposits: [WatchNewDeposit]) {
        let data = try? JSONEncoder().encode(deposits)
        AppConstants.sharedDefaults.set(data, forKey: pendingKey)
    }

    static func loadPending() -> [WatchNewDeposit] {
        guard let data = AppConstants.sharedDefaults.data(forKey: pendingKey) else { return [] }
        return (try? JSONDecoder().decode([WatchNewDeposit].self, from: data)) ?? []
    }

    static func encode<T: Encodable>(_ value: T) -> Data? { try? JSONEncoder().encode(value) }
    static func decode<T: Decodable>(_ type: T.Type, from data: Any?) -> T? {
        guard let data = data as? Data else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
