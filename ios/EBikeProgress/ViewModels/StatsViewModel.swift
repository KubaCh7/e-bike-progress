import Foundation
import Observation

/// Dane ekranu statystyk dla wybranego celu.
@Observable
@MainActor
final class StatsViewModel {
    enum ChartMode: String, CaseIterable, Identifiable {
        case cumulative, monthly
        var id: String { rawValue }
        var title: String {
            switch self {
            case .cumulative: L10n.tr("stats.chart.cumulative")
            case .monthly: L10n.tr("stats.chart.monthly")
            }
        }
    }

    var chartMode: ChartMode = .cumulative
    /// Data wskazana palcem na wykresie (podgląd wartości).
    var selectedDate: Date?

    struct ChartPoint: Identifiable, Hashable {
        var id: Date { date }
        let date: Date
        let value: Double
    }

    func stats(for goal: Goal) -> SavingsStats { goal.stats }

    func cumulative(for goal: Goal) -> [ChartPoint] {
        SavingsStats.cumulativeSeries(goal.activeDeposits.map(\.point))
            .map { ChartPoint(date: $0.date, value: $0.total.doubleValue) }
    }

    func monthly(for goal: Goal) -> [ChartPoint] {
        SavingsStats.monthlyTotals(goal.activeDeposits.map(\.point))
            .map { ChartPoint(date: $0.month, value: $0.total.doubleValue) }
    }

    /// Punkt najbliższy wskazanej dacie.
    func selectedPoint(in points: [ChartPoint]) -> ChartPoint? {
        guard let selectedDate else { return nil }
        switch chartMode {
        case .cumulative:
            return points.last { $0.date <= selectedDate } ?? points.first
        case .monthly:
            let calendar = Calendar.current
            return points.first { calendar.isDate($0.date, equalTo: selectedDate, toGranularity: .month) }
        }
    }

    /// Tekst prognozy: data albo informacja o braku danych / osiągnięciu celu.
    func forecastText(_ stats: SavingsStats) -> String {
        if stats.isAchieved { return L10n.tr("stats.forecastAchieved") }
        guard let date = stats.forecastDate else { return L10n.tr("stats.forecastNone") }
        return date.formatted(.dateTime.month(.abbreviated).year().locale(L10n.locale))
    }

    func forecastDetail(_ stats: SavingsStats) -> String? {
        guard !stats.isAchieved, let date = stats.forecastDate else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: .now), to: date).day ?? 0
        return L10n.tr("stats.inDays", days)
    }

    func monthlyPace(_ stats: SavingsStats) -> String {
        guard let rate = stats.dailyRate else { return "—" }
        return L10n.tr("stats.perMonth", Money.formatShort(rate * 30))
    }
}
