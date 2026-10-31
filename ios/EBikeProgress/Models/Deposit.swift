import Foundation
import SwiftData

/// Pojedyncza wpłata na cel.
@Model
final class Deposit {
    @Attribute(.unique) var id: UUID
    var amount: Decimal
    /// Dzień wpłaty (bez godziny – w bazie typ `date`).
    var date: Date
    var note: String?
    var createdAt: Date
    var updatedAt: Date
    /// Identyfikator celu – przydatny przy synchronizacji.
    var goalID: UUID
    var goal: Goal?

    // MARK: Stan synchronizacji
    var needsSync: Bool = true
    var pendingDelete: Bool = false
    var everSynced: Bool = false

    init(id: UUID = UUID(), amount: Decimal, date: Date = .now, note: String? = nil, goal: Goal) {
        self.id = id
        self.amount = amount
        self.date = Calendar.current.startOfDay(for: date)
        self.note = note
        self.createdAt = .now
        self.updatedAt = .now
        self.goalID = goal.id
        self.goal = goal
    }

    var point: DepositPoint { DepositPoint(amount: amount, date: date) }
}
