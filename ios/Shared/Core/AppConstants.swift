import Foundation

/// Stałe wspólne dla iPhone'a, zegarka i komplikacji.
enum AppConstants {
    /// Domyślny, główny cel tworzony przy pierwszym uruchomieniu.
    static let defaultGoalName = "e-ride pro SR"
    static let defaultGoalTarget: Decimal = 30_000
    static let defaultGoalSeedKey = "ride_pro_sr"
    static let defaultCatalogId = "eride-pro-sr"

    /// Sugerowane zdjęcie SR – asset w Assets.xcassets (podmień na własne zdjęcie).
    static let suggestedPhotoAsset = "ride_pro_sr_placeholder"
    /// Tak zapisujemy w bazie informację "użyj wbudowanego zdjęcia".
    static let suggestedPhotoURL = "asset:ride_pro_sr_placeholder"

    /// Bucket w Supabase Storage na zdjęcia celów.
    static let photoBucket = "goal-photos"

    /// App Group współdzielona przez aplikację zegarka i komplikację.
    /// Wyliczana z bundle ID, więc działa po zmianie BUNDLE_ID_PREFIX.
    static var appGroupID: String {
        let bundleID = Bundle.main.bundleIdentifier ?? "com.kubach7.ebikeprogress"
        if let range = bundleID.range(of: ".ebikeprogress") {
            return "group." + bundleID[..<range.upperBound]
        }
        return "group." + bundleID
    }

    static var sharedDefaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }
}
