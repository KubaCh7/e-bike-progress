import SwiftUI
import Observation

/// Stan formularza dodawania / edycji e-bike'a (nazwa, cena, zdjęcie).
@Observable
@MainActor
final class GoalEditorViewModel {
    let editing: Goal?
    /// Model z katalogu, z którego tworzymy nowy cel (nil = własny e-bike).
    let preset: CatalogBike?
    var name: String
    var priceText: String
    var makeDefault: Bool

    /// Nowe zdjęcie wybrane w formularzu (jeszcze niezapisane).
    var newPhoto: ImageProcessor.Result?
    var useSuggested = false
    var removePhoto = false

    init(goal: Goal?, preset: CatalogBike? = nil, isFirstGoal: Bool = false) {
        editing = goal
        self.preset = preset
        name = goal?.name ?? preset?.displayName ?? ""
        priceText = goal.map { Money.formatNumber($0.targetAmount) } ?? preset.map { Money.formatNumber($0.price) } ?? ""
        makeDefault = goal?.isDefault ?? isFirstGoal
        // dla e-ride pro SR od razu sugerowane zdjęcie
        useSuggested = goal == nil && preset?.id == AppConstants.defaultCatalogId
    }

    var catalogId: String? { editing?.catalogId ?? preset?.id }
    var catalogBike: CatalogBike? { BundledCatalog.bike(id: catalogId) }

    var isEditing: Bool { editing != nil }
    var price: Decimal? { Money.parse(priceText) }
    var trimmedName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }

    var isValid: Bool {
        guard let price, !trimmedName.isEmpty, trimmedName.count <= 120 else { return false }
        return price > 0 && price < 10_000_000
    }

    var title: String { isEditing ? L10n.tr("goals.edit") : L10n.tr("goals.new") }

    /// Sugerowane zdjęcie proponujemy dla e-ride pro SR.
    var canSuggestPhoto: Bool {
        editing?.isSeedGoal == true || catalogId == AppConstants.defaultCatalogId || trimmedName.localizedCaseInsensitiveContains("pro SR")
    }

    var previewImage: UIImage? {
        if let newPhoto { return UIImage(data: newPhoto.photo) }
        if useSuggested { return UIImage(named: AppConstants.suggestedPhotoAsset) }
        if removePhoto { return nil }
        return editing?.uiImage
    }

    var hasPhoto: Bool {
        newPhoto != nil || useSuggested || (!removePhoto && (editing?.photoData != nil || editing?.photoURL != nil))
    }

    func pick(_ result: ImageProcessor.Result) {
        newPhoto = result
        useSuggested = false
        removePhoto = false
    }

    func suggest() {
        newPhoto = nil
        useSuggested = true
        removePhoto = false
    }

    func clearPhoto() {
        newPhoto = nil
        useSuggested = false
        removePhoto = true
    }

    /// Zapisuje cel (nowy lub edytowany).
    @discardableResult
    func save(using goals: GoalsViewModel) -> Bool {
        guard isValid, let price else { return false }
        if let goal = editing {
            if goal.name != trimmedName || goal.targetAmount != price {
                goals.updateGoal(goal, name: trimmedName, target: price)
            }
            if let newPhoto {
                goals.setPhoto(goal, data: newPhoto.photo, thumbnail: newPhoto.thumbnail)
            } else if useSuggested {
                goals.useSuggestedPhoto(goal)
            } else if removePhoto {
                goals.removePhoto(goal)
            }
            if makeDefault && !goal.isDefault {
                goals.setDefault(goal)
            }
        } else {
            goals.createGoal(
                name: trimmedName,
                target: price,
                photo: newPhoto?.photo,
                thumbnail: newPhoto?.thumbnail ?? (useSuggested ? ImageProcessor.suggestedThumbnail() : nil),
                photoURL: useSuggested ? AppConstants.suggestedPhotoURL : nil,
                makeDefault: makeDefault,
                catalogId: catalogId
            )
        }
        return true
    }
}
