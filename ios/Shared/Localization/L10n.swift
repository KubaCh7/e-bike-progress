import Foundation

/// Język interfejsu wybierany w ustawieniach (niezależny od języka systemu).
enum AppLanguage: String, CaseIterable, Identifiable, Codable {
    case pl
    case en

    var id: String { rawValue }

    var locale: Locale {
        switch self {
        case .pl: Locale(identifier: "pl_PL")
        case .en: Locale(identifier: "en_US")
        }
    }

    /// Nazwa języka zawsze w jego własnym języku.
    var displayName: String {
        switch self {
        case .pl: "Polski"
        case .en: "English"
        }
    }
}

/// Tłumaczenia z Localizable.xcstrings z możliwością zmiany języka "w locie".
/// Xcode kompiluje String Catalog do pl.lproj / en.lproj – wybieramy właściwy bundle.
enum L10n {
    static let languageKey = "appLanguage"

    static var current: AppLanguage {
        let raw = UserDefaults.standard.string(forKey: languageKey)
            ?? AppConstants.sharedDefaults.string(forKey: languageKey)
            ?? AppLanguage.pl.rawValue
        return AppLanguage(rawValue: raw) ?? .pl
    }

    static var locale: Locale { current.locale }

    /// Zwraca przetłumaczony tekst dla klucza (opcjonalnie z argumentami %@ / %lld).
    static func tr(_ key: String, _ args: CVarArg...) -> String {
        let format = bundle(for: current).localizedString(forKey: key, value: nil, table: "Localizable")
        guard !args.isEmpty else { return format }
        return String(format: format, locale: current.locale, arguments: args)
    }

    private static func bundle(for language: AppLanguage) -> Bundle {
        if let path = Bundle.main.path(forResource: language.rawValue, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            return bundle
        }
        return .main
    }
}
