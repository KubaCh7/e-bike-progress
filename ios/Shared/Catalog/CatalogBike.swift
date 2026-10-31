import Foundation
import SwiftUI

/// Kategoria e-bike'a w katalogu.
enum BikeCategory: String, Codable, CaseIterable, Identifiable, Sendable {
    case moto, emtb, city
    var id: String { rawValue }

    var title: String { L10n.tr("catalog.\(rawValue)") }
}

/// Model z katalogu popularnych e-bike'ów (catalog/bikes.json / tabela bike_catalog).
struct CatalogBike: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let brand: String
    let model: String
    let category: BikeCategory
    /// Orientacyjna cena w PLN.
    let price: Decimal
    let color: String
    var featured: Bool?
    /// Zdjęcie na wolnej licencji (Wikimedia Commons) – opcjonalne.
    var imageURL: String?
    /// Autor / źródło zdjęcia (wymagane przez licencję).
    var imageCredit: String?
    /// Ranking popularności (1 = najpopularniejszy).
    var popularity: Int?

    enum CodingKeys: String, CodingKey {
        case id, brand, model, category, price, color, featured, popularity
        case imageURL = "image_url"
        case imageCredit = "image_credit"
    }

    var displayName: String { "\(brand) \(model)" }
    var image: URL? { imageURL.flatMap(URL.init(string:)) }
    var rank: Int { popularity ?? 100 }
    var tint: Color { Color(hex: color) ?? .teal }
}

/// Katalog wbudowany w aplikację (działa offline). Aktualny katalog pobierany jest z Supabase.
enum BundledCatalog {
    private struct File: Decodable { let bikes: [CatalogBike] }

    static let bikes: [CatalogBike] = {
        guard let url = Bundle.main.url(forResource: "bikes", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let file = try? JSONDecoder().decode(File.self, from: data) else { return [] }
        return file.bikes
    }()

    /// Najnowszy katalog pobrany z serwera (nil = tylko wbudowany).
    static var remote: [CatalogBike]?

    /// Aktualnie obowiązujący katalog.
    static var current: [CatalogBike] { remote ?? bikes }

    static func bike(id: String?) -> CatalogBike? {
        guard let id else { return nil }
        return current.first { $0.id == id } ?? bikes.first { $0.id == id }
    }
}

extension Color {
    /// Kolor z zapisu "#rrggbb".
    init?(hex: String) {
        var value = hex.trimmingCharacters(in: .whitespaces)
        if value.hasPrefix("#") { value.removeFirst() }
        guard value.count == 6, let rgb = UInt32(value, radix: 16) else { return nil }
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}
