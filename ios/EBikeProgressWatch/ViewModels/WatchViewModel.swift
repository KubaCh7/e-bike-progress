import Foundation
import Observation

/// ViewModel zegarka: postęp głównego celu, dodawanie wpłat, ostatnie wpłaty.
@Observable
@MainActor
final class WatchViewModel {
    let connectivity: WatchConnectivityManager
    /// Kwota ustawiana Digital Crown.
    var amount: Double = 100
    /// Krótkie potwierdzenie po dodaniu wpłaty.
    var confirmation: String?

    static let quickAmounts: [Decimal] = [20, 50, 100, 200, 500]
    static let crownRange: ClosedRange<Double> = 0...10_000

    init(connectivity: WatchConnectivityManager) {
        self.connectivity = connectivity
    }

    var snapshot: WatchSnapshot { connectivity.snapshot }
    var language: String { snapshot.language }

    /// Uzbierane z uwzględnieniem wpłat jeszcze niepotwierdzonych przez iPhone'a.
    var saved: Decimal {
        snapshot.saved + connectivity.pending.reduce(Decimal.zero) { $0 + $1.amount }
    }

    var remaining: Decimal { max(snapshot.target - saved, 0) }

    var progress: Double {
        snapshot.target > 0 ? min(max((saved / snapshot.target).doubleValue, 0), 1) : 0
    }

    /// Ostatnie wpłaty: oczekujące na górze, potem potwierdzone.
    var recentItems: [(deposit: WatchDeposit, isPending: Bool)] {
        let pendingItems = connectivity.pending.reversed().map {
            (deposit: WatchDeposit(id: $0.id, amount: $0.amount, date: $0.date, note: nil), isPending: true)
        }
        let confirmed = snapshot.recent.map { (deposit: $0, isPending: false) }
        return pendingItems + confirmed
    }

    var amountDecimal: Decimal { Decimal(amount.rounded()) }

    func addQuick(_ value: Decimal) {
        amount = min(amount + value.doubleValue, Self.crownRange.upperBound)
    }

    func resetAmount() { amount = 0 }

    /// Dodaje wpłatę z dzisiejszą datą.
    func submit() {
        let value = amountDecimal
        guard value > 0 else { return }
        connectivity.send(WatchNewDeposit(id: UUID(), goalID: snapshot.goalID, amount: value, date: .now))
        confirmation = L10n.tr("home.quickAdded", Money.formatShort(value))
        amount = 100
    }

    func refresh() { connectivity.requestSnapshot() }
}
