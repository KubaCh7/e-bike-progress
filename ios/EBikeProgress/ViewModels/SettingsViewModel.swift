import Foundation
import Observation

/// Ustawienia: edycja kwoty bieżącego celu.
@Observable
@MainActor
final class SettingsViewModel {
    var targetText = ""
    var savedMessage: String?

    func load(from goal: Goal?) {
        targetText = goal.map { Money.formatNumber($0.targetAmount) } ?? ""
    }

    func canSave(goal: Goal?) -> Bool {
        guard let goal, let value = Money.parse(targetText) else { return false }
        return value > 0 && value != goal.targetAmount
    }

    func saveTarget(goal: Goal?, using goals: GoalsViewModel) {
        guard let goal, let value = Money.parse(targetText), value > 0 else { return }
        goals.updateGoal(goal, name: goal.name, target: value)
        targetText = Money.formatNumber(value)
        savedMessage = L10n.tr("settings.saved")
    }
}
