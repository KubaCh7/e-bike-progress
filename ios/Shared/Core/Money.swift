import Foundation

/// Formatowanie i parsowanie kwot – zawsze PLN w polskim formacie (12 500,00 zł).
enum Money {
    static let currencyCode = "PLN"
    static let polishLocale = Locale(identifier: "pl_PL")

    /// Pełny format z groszami: "12 500,00 zł".
    static func format(_ value: Decimal) -> String {
        value.formatted(.currency(code: currencyCode).locale(polishLocale))
    }

    /// Krótki format bez groszy: "12 500 zł" (zegarek, komplikacja, wykresy).
    static func formatShort(_ value: Decimal) -> String {
        value.formatted(
            .currency(code: currencyCode)
                .locale(polishLocale)
                .precision(.fractionLength(0))
        )
    }

    /// Sama liczba bez waluty: "12 500,00".
    static func formatNumber(_ value: Decimal) -> String {
        value.formatted(.number.locale(polishLocale).precision(.fractionLength(2)))
    }

    /// Parsuje tekst wpisany przez użytkownika: "12 500,50", "12500.5", "1 000 zł".
    static func parse(_ text: String) -> Decimal? {
        var cleaned = text
            .replacingOccurrences(of: "zł", with: "")
            .replacingOccurrences(of: "PLN", with: "")
            .filter { !$0.isWhitespace && $0 != "\u{00A0}" && $0 != "\u{202F}" }
        // jeśli są i kropki, i przecinki – kropka jest separatorem tysięcy
        if cleaned.contains(",") && cleaned.contains(".") {
            cleaned = cleaned.replacingOccurrences(of: ".", with: "")
        }
        cleaned = cleaned.replacingOccurrences(of: ",", with: ".")
        guard !cleaned.isEmpty, let value = Decimal(string: cleaned, locale: Locale(identifier: "en_US_POSIX")) else {
            return nil
        }
        return value.rounded(scale: 2)
    }

    static func percent(_ progress: Double) -> String {
        progress.formatted(.percent.precision(.fractionLength(0)).locale(polishLocale))
    }
}

extension Decimal {
    /// Zaokrąglenie do podanej liczby miejsc po przecinku.
    func rounded(scale: Int) -> Decimal {
        var value = self
        var result = Decimal()
        NSDecimalRound(&result, &value, scale, .plain)
        return result
    }

    var doubleValue: Double { NSDecimalNumber(decimal: self).doubleValue }
}
