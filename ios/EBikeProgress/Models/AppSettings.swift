import SwiftUI

/// Motyw aplikacji wybierany w ustawieniach.
enum AppTheme: String, CaseIterable, Identifiable {
    case system, light, dark

    var id: String { rawValue }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }

    var title: String { L10n.tr("settings.theme.\(rawValue)") }

    var systemImage: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max.fill"
        case .dark: "moon.fill"
        }
    }
}

/// Klucze @AppStorage.
enum SettingsKey {
    static let language = L10n.languageKey
    static let theme = "appTheme"
}

/// Zakładki aplikacji.
enum AppTab: Hashable {
    case home, history, stats, settings
}
