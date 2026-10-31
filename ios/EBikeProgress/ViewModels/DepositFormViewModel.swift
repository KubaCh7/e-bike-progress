import Foundation
import Observation

/// Stan formularza "Dodaj / edytuj wpłatę".
@Observable
@MainActor
final class DepositFormViewModel {
    var amountText: String
    var date: Date
    var note: String
    let editing: Deposit?

    init(deposit: Deposit? = nil) {
        editing = deposit
        amountText = deposit.map { Money.formatNumber($0.amount) } ?? ""
        date = deposit?.date ?? .now
        note = deposit?.note ?? ""
    }

    var isEditing: Bool { editing != nil }
    var amount: Decimal? { Money.parse(amountText) }

    var isValid: Bool {
        guard let amount else { return false }
        return amount > 0 && amount < 10_000_000
    }

    var title: String {
        isEditing ? L10n.tr("deposit.edit") : L10n.tr("deposit.new")
    }

    /// Dodaje kwotę z szybkiego przycisku do wpisanej wartości.
    func add(_ value: Decimal) {
        amountText = Money.formatNumber((amount ?? 0) + value)
    }

    /// Zapisuje wpłatę. Zwraca true, jeśli się udało.
    @discardableResult
    func save(using goals: GoalsViewModel, goal: Goal) -> Bool {
        guard isValid, let amount else { return false }
        if let editing {
            goals.updateDeposit(editing, amount: amount, date: date, note: note)
        } else {
            goals.addDeposit(amount: amount, date: date, note: note, to: goal)
        }
        return true
    }

    func delete(using goals: GoalsViewModel) {
        guard let editing else { return }
        goals.deleteDeposit(editing)
    }
}
