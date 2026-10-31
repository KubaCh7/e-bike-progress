import Foundation

/// Minimalna informacja o wpłacie potrzebna do statystyk (wspólna dla iOS / watchOS).
struct DepositPoint: Hashable, Sendable {
    let amount: Decimal
    let date: Date
}

/// Statystyki celu: uzbierane, pozostało, średnia, suma w miesiącu, prognoza.
struct SavingsStats: Equatable {
    let target: Decimal
    let total: Decimal
    let remaining: Decimal
    /// Postęp 0...1 (obcięty do 1).
    let progress: Double
    let count: Int
    let average: Decimal?
    let thisMonth: Decimal
    /// Średnie tempo oszczędzania (zł / dzień).
    let dailyRate: Decimal?
    /// Prognozowana data osiągnięcia celu (nil – brak danych lub cel osiągnięty).
    let forecastDate: Date?
    var isAchieved: Bool { total >= target && target > 0 }

    /// Minimalne okno do liczenia tempa – chroni przed absurdalną prognozą po jednej wpłacie.
    static let minimumWindowDays = 30

    init(target: Decimal, deposits: [DepositPoint], now: Date = .now, calendar: Calendar = .current) {
        self.target = target
        let total = deposits.reduce(Decimal.zero) { $0 + $1.amount }
        self.total = total
        self.remaining = max(target - total, 0)
        self.progress = target > 0 ? min(max((total / target).doubleValue, 0), 1) : 0
        self.count = deposits.count
        self.average = deposits.isEmpty ? nil : (total / Decimal(deposits.count)).rounded(scale: 2)

        let monthStart = calendar.dateInterval(of: .month, for: now)?.start ?? now
        self.thisMonth = deposits
            .filter { $0.date >= monthStart && $0.date <= now.addingTimeInterval(86_400) }
            .reduce(Decimal.zero) { $0 + $1.amount }

        // Prognoza: średnie dzienne tempo od pierwszej wpłaty (min. 30 dni).
        if let first = deposits.map(\.date).min(), total > 0 {
            let start = calendar.startOfDay(for: first)
            let today = calendar.startOfDay(for: now)
            let days = (calendar.dateComponents([.day], from: start, to: today).day ?? 0) + 1
            let window = max(days, Self.minimumWindowDays)
            let rate = total / Decimal(window)
            self.dailyRate = rate.rounded(scale: 2)
            if total >= target {
                self.forecastDate = nil
            } else {
                let daysLeft = ((target - total) / rate).doubleValue.rounded(.up)
                self.forecastDate = calendar.date(byAdding: .day, value: Int(min(daysLeft, 36_500)), to: today)
            }
        } else {
            self.dailyRate = nil
            self.forecastDate = nil
        }
    }

    // MARK: - Dane do wykresów

    struct CumulativePoint: Identifiable, Hashable {
        var id: Date { date }
        let date: Date
        let total: Decimal
    }

    struct MonthlyPoint: Identifiable, Hashable {
        var id: Date { month }
        let month: Date
        let total: Decimal
    }

    /// Suma narastająco – jeden punkt na dzień.
    static func cumulativeSeries(_ deposits: [DepositPoint], calendar: Calendar = .current) -> [CumulativePoint] {
        let byDay = Dictionary(grouping: deposits) { calendar.startOfDay(for: $0.date) }
        var running = Decimal.zero
        return byDay.keys.sorted().map { day in
            running += byDay[day, default: []].reduce(Decimal.zero) { $0 + $1.amount }
            return CumulativePoint(date: day, total: running)
        }
    }

    /// Suma wpłat w poszczególnych miesiącach (z uzupełnieniem pustych miesięcy).
    static func monthlyTotals(_ deposits: [DepositPoint], calendar: Calendar = .current) -> [MonthlyPoint] {
        guard let first = deposits.map(\.date).min(), let last = deposits.map(\.date).max() else { return [] }
        let byMonth = Dictionary(grouping: deposits) {
            calendar.dateInterval(of: .month, for: $0.date)?.start ?? $0.date
        }
        var result: [MonthlyPoint] = []
        var cursor = calendar.dateInterval(of: .month, for: first)?.start ?? first
        let end = calendar.dateInterval(of: .month, for: last)?.start ?? last
        while cursor <= end {
            let sum = byMonth[cursor, default: []].reduce(Decimal.zero) { $0 + $1.amount }
            result.append(MonthlyPoint(month: cursor, total: sum))
            guard let next = calendar.date(byAdding: .month, value: 1, to: cursor) else { break }
            cursor = next
        }
        return result
    }
}
