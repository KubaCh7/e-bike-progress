import Foundation
import Observation
import Supabase

/// Katalog e-bike'ów: wbudowany + najnowszy z Supabase (nowe modele bez aktualizacji aplikacji).
@Observable
@MainActor
final class CatalogStore {
    private(set) var bikes: [CatalogBike] = BundledCatalog.current
    private let client: SupabaseClient?

    init(client: SupabaseClient? = SupabaseConfig.client) {
        self.client = client
    }

    func refresh() async {
        guard let client else { return }
        do {
            let rows: [CatalogBike] = try await client.from("bike_catalog")
                .select("id, brand, model, category, price, color, featured, image_url, image_credit")
                .order("sort")
                .execute()
                .value
            guard !rows.isEmpty else { return }
            BundledCatalog.remote = rows
            bikes = rows
        } catch {
            print("Catalog fetch error: \(error)")
        }
    }
}
