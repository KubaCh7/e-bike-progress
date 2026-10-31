import Foundation

/// Wiersz tabeli `goals` w Supabase.
struct GoalRow: Codable, Sendable {
    let id: UUID
    var userID: UUID
    var name: String
    var targetAmount: Decimal
    var photoURL: String?
    var isDefault: Bool
    var seedKey: String?
    var createdAt: String
    /// Ustawiane przez serwer (trigger) – przy wysyłaniu pomijamy (nil).
    var updatedAt: String?
    var deletedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case userID = "user_id"
        case targetAmount = "target_amount"
        case photoURL = "photo_url"
        case isDefault = "is_default"
        case seedKey = "seed_key"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
    }
}

/// Wiersz tabeli `deposits` w Supabase.
struct DepositRow: Codable, Sendable {
    let id: UUID
    var userID: UUID
    var goalID: UUID
    var amount: Decimal
    /// Typ `date` w Postgresie: "yyyy-MM-dd".
    var depositDate: String
    var note: String?
    var createdAt: String
    var updatedAt: String?
    var deletedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, amount, note
        case userID = "user_id"
        case goalID = "goal_id"
        case depositDate = "deposit_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
    }
}

/// Konwersje dat Postgres <-> Swift.
enum PGDate {
    private static let isoFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let iso: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static let day: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static func timestamp(_ date: Date) -> String { isoFractional.string(from: date) }

    /// Parsuje timestamptz (Postgres zwraca do 6 cyfr ułamka sekundy).
    static func parseTimestamp(_ string: String) -> Date? {
        var normalized = string.replacingOccurrences(of: " ", with: "T")
        // skróć ułamek sekundy do 3 cyfr – ISO8601DateFormatter nie lubi mikrosekund
        if let dot = normalized.firstIndex(of: ".") {
            let afterDot = normalized.index(after: dot)
            let digitsEnd = normalized[afterDot...].firstIndex { !$0.isNumber } ?? normalized.endIndex
            let digits = normalized[afterDot..<digitsEnd]
            let ms = String(digits.prefix(3)).padding(toLength: 3, withPad: "0", startingAt: 0)
            normalized.replaceSubrange(afterDot..<digitsEnd, with: ms)
        }
        if normalized.hasSuffix("+00") { normalized += ":00" }
        return isoFractional.date(from: normalized) ?? iso.date(from: normalized)
    }

    static func dayString(_ date: Date) -> String { day.string(from: date) }
    static func parseDay(_ string: String) -> Date? { day.date(from: String(string.prefix(10))) }
}
