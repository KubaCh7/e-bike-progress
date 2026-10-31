import Foundation
import SwiftData
import Observation

/// Główny ViewModel: lista celów, wybrany cel, operacje na celach i wpłatach.
@Observable
@MainActor
final class GoalsViewModel {
    private(set) var goals: [Goal] = []
    /// Wybrany w selektorze cel (domyślnie cel główny).
    var selectedGoalID: UUID? {
        didSet { UserDefaults.standard.set(selectedGoalID?.uuidString, forKey: Self.selectedKey) }
    }
    /// Krótki komunikat (np. "Dodano 100 zł") pokazywany jako toast.
    var toast: String?

    let repository: GoalRepository
    /// Wywoływane po każdej zmianie danych (synchronizacja, zegarek).
    @ObservationIgnored var onDataChanged: (() -> Void)?

    private static let selectedKey = "selectedGoalID"

    init(repository: GoalRepository) {
        self.repository = repository
        if let raw = UserDefaults.standard.string(forKey: Self.selectedKey) {
            selectedGoalID = UUID(uuidString: raw)
        }
        // cele wybiera się na ekranie powitalnym (OnboardingView)
        repository.onChange = { [weak self] in
            self?.reload()
            self?.onDataChanged?()
        }
        reload()
    }

    // MARK: - Odczyt

    var currentGoal: Goal? {
        goals.first { $0.id == selectedGoalID } ?? defaultGoal ?? goals.first
    }

    var defaultGoal: Goal? { goals.first { $0.isDefault } }

    func reload() {
        goals = repository.fetchGoals()
        if let id = selectedGoalID, !goals.contains(where: { $0.id == id }) {
            selectedGoalID = defaultGoal?.id
        }
    }

    func select(_ goal: Goal) {
        selectedGoalID = goal.id
    }

    // MARK: - Wpłaty

    func addDeposit(amount: Decimal, date: Date = .now, note: String? = nil, to goal: Goal? = nil) {
        guard let goal = goal ?? currentGoal, amount > 0 else { return }
        repository.addDeposit(to: goal, amount: amount, date: date, note: note)
        toast = L10n.tr("home.quickAdded", Money.format(amount))
    }

    func updateDeposit(_ deposit: Deposit, amount: Decimal, date: Date, note: String?) {
        repository.updateDeposit(deposit, amount: amount, date: date, note: note)
    }

    func deleteDeposit(_ deposit: Deposit) {
        repository.deleteDeposit(deposit)
    }

    // MARK: - Cele

    @discardableResult
    func createGoal(name: String, target: Decimal, photo: Data?, thumbnail: Data?, photoURL: String?, makeDefault: Bool, catalogId: String? = nil) -> Goal {
        let goal = repository.createGoal(name: name, target: target, photo: photo, thumbnail: thumbnail, photoURL: photoURL, makeDefault: makeDefault, catalogId: catalogId)
        selectedGoalID = goal.id
        return goal
    }

    func updateGoal(_ goal: Goal, name: String, target: Decimal) {
        repository.updateGoal(goal, name: name, target: target)
    }

    // MARK: - Zdjęcia

    func setPhoto(_ goal: Goal, data: Data, thumbnail: Data?) {
        repository.setPhoto(goal, data: data, thumbnail: thumbnail)
    }

    func useSuggestedPhoto(_ goal: Goal) {
        repository.useSuggestedPhoto(goal, thumbnail: ImageProcessor.suggestedThumbnail())
    }

    func removePhoto(_ goal: Goal) {
        repository.removePhoto(goal)
    }

    func setDefault(_ goal: Goal) {
        repository.setDefault(goal)
        selectedGoalID = goal.id
    }

    func deleteGoal(_ goal: Goal) {
        if selectedGoalID == goal.id { selectedGoalID = nil }
        repository.deleteGoal(goal)
    }
}
