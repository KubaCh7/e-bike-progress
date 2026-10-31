import SwiftUI
import Charts

/// Statystyki: średnia wpłata, suma w miesiącu, prognoza, wykres wpłat w czasie.
struct StatsView: View {
    @Environment(GoalsViewModel.self) private var goals
    @State private var model = StatsViewModel()

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground(photo: goals.currentGoal?.uiImage)
                if let goal = goals.currentGoal {
                    content(goal: goal)
                }
            }
            .navigationTitle(L10n.tr("stats.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) { GoalSwitcherMenu() }
            }
        }
    }

    private func content(goal: Goal) -> some View {
        let stats = model.stats(for: goal)
        return ScrollView {
            VStack(spacing: 16) {
                GlassEffectContainer(spacing: 12) {
                    LazyVGrid(columns: columns, spacing: 12) {
                        StatTile(title: L10n.tr("stats.average"), value: stats.average.map(Money.format) ?? "—", systemImage: "divide")
                        StatTile(title: L10n.tr("stats.thisMonth"), value: Money.format(stats.thisMonth), systemImage: "calendar")
                        StatTile(title: L10n.tr("stats.forecast"), value: model.forecastText(stats), detail: model.forecastDetail(stats), systemImage: "flag.checkered")
                        StatTile(title: L10n.tr("stats.pace"), value: model.monthlyPace(stats), detail: L10n.tr("history.count", stats.count), systemImage: "speedometer")
                    }
                }

                chartCard(goal: goal, stats: stats)

                Text(L10n.tr("stats.forecastHint"))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
            }
            .padding()
        }
    }

    private func chartCard(goal: Goal, stats: SavingsStats) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(L10n.tr("stats.chart"))
                .font(.headline)

            Picker(L10n.tr("stats.chart"), selection: $model.chartMode) {
                ForEach(StatsViewModel.ChartMode.allCases) { mode in
                    Text(mode.title).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            let points = model.chartMode == .cumulative ? model.cumulative(for: goal) : model.monthly(for: goal)
            if points.isEmpty {
                Text(L10n.tr("stats.empty"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                chart(points: points, target: goal.targetAmount.doubleValue)
                    .frame(height: 240)
                    .animation(.smooth, value: model.chartMode)
            }
        }
        .padding(18)
        .glassEffect(.regular, in: .rect(cornerRadius: 28))
    }

    @ViewBuilder
    private func chart(points: [StatsViewModel.ChartPoint], target: Double) -> some View {
        let selected = model.selectedPoint(in: points)
        Chart {
            switch model.chartMode {
            case .cumulative:
                ForEach(points) { point in
                    AreaMark(x: .value("Data", point.date), y: .value("Suma", point.value))
                        .interpolationMethod(.monotone)
                        .foregroundStyle(
                            LinearGradient(colors: [.teal.opacity(0.35), .teal.opacity(0.02)], startPoint: .top, endPoint: .bottom)
                        )
                    LineMark(x: .value("Data", point.date), y: .value("Suma", point.value))
                        .interpolationMethod(.monotone)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        .foregroundStyle(.teal)
                }
                RuleMark(y: .value(L10n.tr("stats.chart.target"), target))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(.secondary)
                    .annotation(position: .top, alignment: .leading) {
                        Text(L10n.tr("stats.chart.targetLabel", Money.formatShort(Decimal(target))))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
            case .monthly:
                ForEach(points) { point in
                    BarMark(x: .value("Miesiąc", point.date, unit: .month), y: .value("Suma", point.value))
                        .clipShape(UnevenRoundedRectangle(topLeadingRadius: 4, topTrailingRadius: 4))
                        .foregroundStyle(.teal.opacity(selected == nil || selected?.date == point.date ? 1 : 0.4))
                }
            }

            if let selected {
                RuleMark(x: .value("Data", selected.date, unit: model.chartMode == .monthly ? .month : .day))
                    .foregroundStyle(.secondary.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1))
                    .annotation(position: .top, overflowResolution: .init(x: .fit(to: .chart), y: .disabled)) {
                        VStack(spacing: 2) {
                            Text(selected.date.formatted(model.chartMode == .monthly
                                ? .dateTime.month(.wide).year().locale(L10n.locale)
                                : .dateTime.day().month(.abbreviated).year().locale(L10n.locale)))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(Money.format(Decimal(selected.value)))
                                .font(.caption.bold().monospacedDigit())
                        }
                        .padding(8)
                        .glassEffect(.regular, in: .rect(cornerRadius: 12))
                    }
            }
        }
        .chartXSelection(value: $model.selectedDate)
        .chartYScale(domain: .automatic(includesZero: true))
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(.secondary.opacity(0.3))
                AxisValueLabel {
                    if let amount = value.as(Double.self) {
                        Text(Decimal(amount).formatted(.number.notation(.compactName).locale(L10n.locale)))
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 4)) { _ in
                AxisValueLabel(format: model.chartMode == .monthly
                    ? .dateTime.month(.abbreviated).locale(L10n.locale)
                    : .dateTime.day().month(.abbreviated).locale(L10n.locale))
            }
        }
    }
}

/// Kafelek statystyki na szkle.
struct StatTile: View {
    let title: String
    let value: String
    var detail: String?
    let systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(title, systemImage: systemImage)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Text(value)
                .font(.title3.bold().monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(detail ?? " ")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .glassEffect(.regular, in: .rect(cornerRadius: 22))
    }
}

#Preview {
    let container = PersistenceController.preview
    let vm = GoalsViewModel(repository: GoalRepository(context: container.mainContext))
    return StatsView().environment(vm)
}
