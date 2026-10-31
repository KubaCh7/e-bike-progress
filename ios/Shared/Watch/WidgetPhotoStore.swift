import Foundation

/// Zdjęcie głównego e-bike'a dla widżetów iPhone'a (plik w App Group) i jego kadr.
enum WidgetPhotoStore {
    private static let fileName = "widgetPhoto.jpg"
    private static let positionKey = "widgetPhotoPosition"

    private static var fileURL: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: AppConstants.appGroupID)?
            .appendingPathComponent(fileName)
    }

    /// Zapisuje zdjęcie (nil = brak zdjęcia – plik jest usuwany).
    static func save(_ data: Data?, position: String?) {
        AppConstants.sharedDefaults.set(position, forKey: positionKey)
        guard let url = fileURL else { return }
        if let data {
            if (try? Data(contentsOf: url)) == data { return }
            try? data.write(to: url, options: .atomic)
        } else {
            try? FileManager.default.removeItem(at: url)
        }
    }

    static func load() -> Data? {
        guard let url = fileURL else { return nil }
        return try? Data(contentsOf: url)
    }

    /// Kadr „x% y%” (jak na stronie); nil = środek.
    static var position: String? {
        AppConstants.sharedDefaults.string(forKey: positionKey)
    }
}
