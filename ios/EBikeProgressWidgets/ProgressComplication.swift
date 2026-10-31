import WidgetKit
import SwiftUI

/// Wpis osi czasu komplikacji – postęp głównego celu.
struct ProgressEntry: TimelineEntry {
    let date: Date
    let goalName: String
    let progress: Double
    let saved: Decimal
    let target: Decimal

    static let placeholder = ProgressEntry(date: .now, goalName: AppConstants.defaultGoalName, progress: 0.42, saved: 12_600, target: 30_000)

    /// Odczyt ze współdzielonej App Group (zapisuje aplikacja zegarka).
    static func current() -> ProgressEntry {
        let snapshot = SnapshotStore.load() ?? .placeholder
        let pending = SnapshotStore.loadPending().reduce(Decimal.zero) { $0 + $1.amount }
        let saved = snapshot.saved + pending
        let progress = snapshot.target > 0 ? min(max((saved / snapshot.target).doubleValue, 0), 1) : 0
        return ProgressEntry(date: .now, goalName: snapshot.goalName, progress: progress, saved: saved, target: snapshot.target)
    }
}

struct ProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(context.isPreview ? .placeholder : .current())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        // aplikacja zegarka przeładowuje oś czasu po każdej zmianie; dodatkowo co godzinę
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
        completion(Timeline(entries: [.current()], policy: .after(next)))
    }
}

struct ProgressComplication: Widget {
    let kind = "ProgressComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProgressProvider()) { entry in
            ProgressComplicationView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName(L10n.tr("complication.name"))
        .description(L10n.tr("complication.description"))
        .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryRectangular, .accessoryInline])
    }
}

struct ProgressComplicationView: View {
    let entry: ProgressEntry
    @Environment(\.widgetFamily) private var family

    private var percentText: String { Money.percent(entry.progress) }

    var body: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: entry.progress) {
                Image(systemName: "bicycle")
            } currentValueLabel: {
                Text(verbatim: "\(Int((entry.progress * 100).rounded()))")
                    .font(.system(.body, design: .rounded).bold())
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(.teal)
            .widgetAccentable()

        case .accessoryCorner:
            Text(percentText)
                .font(.system(.title3, design: .rounded).bold())
                .widgetCurvesContent()
                .widgetLabel {
                    Gauge(value: entry.progress) {
                        Text(verbatim: "SR")
                    }
                    .tint(.teal)
                }

        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Image(systemName: "bicycle")
                    Text(entry.goalName).lineLimit(1)
                }
                .font(.headline)
                .widgetAccentable()
                Text(verbatim: "\(percentText) · \(Money.formatShort(entry.saved))")
                    .font(.caption.monospacedDigit())
                Gauge(value: entry.progress) { EmptyView() }
                    .gaugeStyle(.accessoryLinearCapacity)
                    .tint(.teal)
            }

        default:
            Text(verbatim: "🚲 \(percentText) · \(Money.formatShort(entry.saved))")
        }
    }
}

#Preview(as: .accessoryCircular) {
    ProgressComplication()
} timeline: {
    ProgressEntry.placeholder
}

#Preview(as: .accessoryRectangular) {
    ProgressComplication()
} timeline: {
    ProgressEntry.placeholder
}
