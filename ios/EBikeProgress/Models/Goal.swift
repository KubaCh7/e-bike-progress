import Foundation
import SwiftData

/// Cel oszczędzania – konkretny e-bike (lokalna kopia w SwiftData).
@Model
final class Goal {
    @Attribute(.unique) var id: UUID
    var name: String
    var targetAmount: Decimal
    /// Ścieżka w Supabase Storage albo "asset:ride_pro_sr_placeholder".
    var photoURL: String?
    /// Skompresowane zdjęcie trzymane lokalnie (działa offline).
    @Attribute(.externalStorage) var photoData: Data?
    /// Miniatura (np. dla Apple Watch).
    var thumbnailData: Data?
    var isDefault: Bool
    var createdAt: Date
    var updatedAt: Date
    /// Znacznik celu tworzonego automatycznie ("ride_pro_sr").
    var seedKey: String?
    /// Model z katalogu, z którego powstał cel (nil = własny e-bike).
    var catalogId: String?

    // MARK: Stan synchronizacji
    /// Lokalna zmiana czeka na wysłanie do Supabase.
    var needsSync: Bool = true
    /// Nowe zdjęcie czeka na wgranie do Storage.
    var photoNeedsUpload: Bool = false
    /// Usunięty lokalnie – zniknie po wysłaniu informacji na serwer.
    var pendingDelete: Bool = false
    /// Rekord był już kiedyś na serwerze.
    var everSynced: Bool = false

    @Relationship(deleteRule: .cascade, inverse: \Deposit.goal)
    var deposits: [Deposit]? = []

    init(
        id: UUID = UUID(),
        name: String,
        targetAmount: Decimal,
        photoURL: String? = nil,
        isDefault: Bool = false,
        createdAt: Date = .now,
        seedKey: String? = nil,
        catalogId: String? = nil
    ) {
        self.id = id
        self.name = name
        self.targetAmount = targetAmount
        self.photoURL = photoURL
        self.isDefault = isDefault
        self.createdAt = createdAt
        self.updatedAt = createdAt
        self.seedKey = seedKey
        self.catalogId = catalogId ?? (seedKey == AppConstants.defaultGoalSeedKey ? AppConstants.defaultCatalogId : nil)
    }

    /// Aktywne (nieusunięte) wpłaty.
    var activeDeposits: [Deposit] {
        (deposits ?? []).filter { !$0.pendingDelete }
    }

    /// Wpłaty od najnowszej.
    var sortedDeposits: [Deposit] {
        activeDeposits.sorted { ($0.date, $0.createdAt) > ($1.date, $1.createdAt) }
    }

    var stats: SavingsStats {
        SavingsStats(target: targetAmount, deposits: activeDeposits.map(\.point))
    }

    var isSuggestedPhoto: Bool { photoURL == AppConstants.suggestedPhotoURL }
    var isSeedGoal: Bool { seedKey == AppConstants.defaultGoalSeedKey || catalogId == AppConstants.defaultCatalogId }

    /// Model z katalogu (do ilustracji i podpowiedzi).
    var catalogBike: CatalogBike? { BundledCatalog.bike(id: catalogId) }
}
