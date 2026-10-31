import WidgetKit
import SwiftUI

/// Stan głównego celu dla widżetu – czytany z App Group (zapisuje go aplikacja na iPhonie).
struct SavingsEntry: TimelineEntry {
    let date: Date
    let goalName: String
    let saved: Decimal
    let target: Decimal
    let thumbnail: Data?

    var progress: Double { target > 0 ? min(max((saved / target).doubleValue, 0), 1) : 0 }
    var remaining: Decimal { max(target - saved, 0) }
    var percentNumber: Int { Int((progress * 100).rounded()) }

    static let placeholder = SavingsEntry(date: .now, goalName: AppConstants.defaultGoalName, saved: 12_600, target: 30_000, thumbnail: nil)

    static func current() -> SavingsEntry {
        guard let snapshot = SnapshotStore.load() else { return .placeholder }
        return SavingsEntry(date: .now, goalName: snapshot.goalName, saved: snapshot.saved, target: snapshot.target, thumbnail: snapshot.thumbnail)
    }
}

struct SavingsProvider: TimelineProvider {
    func placeholder(in context: Context) -> SavingsEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (SavingsEntry) -> Void) {
        completion(context.isPreview ? .placeholder : .current())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SavingsEntry>) -> Void) {
        // aplikacja przeładowuje widżety po każdej wpłacie; dodatkowo co godzinę
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
        completion(Timeline(entries: [.current()], policy: .after(next)))
    }
}

struct SavingsWidget: Widget {
    let kind = "SavingsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SavingsProvider()) { entry in
            SavingsWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName(L10n.tr("widget.name"))
        .description(L10n.tr("widget.description"))
        .supportedFamilies([
            .accessoryCircular, .accessoryRectangular, .accessoryInline,
            .systemSmall, .systemMedium,
        ])
    }
}

struct SavingsWidgetView: View {
    let entry: SavingsEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        switch family {
        // Ekran blokady – okrągły jak w widżecie „Baterie”: ikona e-bike'a w pierścieniu i procent
        case .accessoryCircular:
            Gauge(value: entry.progress) {
                Image(systemName: "bicycle")
            } currentValueLabel: {
                Image(systemName: "bicycle")
                    .font(.system(size: 18, weight: .semibold))
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .widgetAccentable()
            .accessibilityLabel(Text(verbatim: "\(entry.goalName), \(Money.formatShort(entry.saved))"))

        // Ekran blokady – prostokątny: nazwa e-bike'a, ile zebrane, pasek
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.goalName)
                    .font(.headline)
                    .lineLimit(1)
                    .widgetAccentable()
                Text(verbatim: "\(Money.formatShort(entry.saved)) / \(Money.formatShort(entry.target))")
                    .font(.caption.monospacedDigit())
                    .lineLimit(1)
                Gauge(value: entry.progress) { EmptyView() }
                    .gaugeStyle(.accessoryLinearCapacity)
            }

        case .accessoryInline:
            Text(verbatim: "\(entry.goalName) · \(Money.formatShort(entry.saved))")

        // Ekran początkowy / biurko Maca – mały: pierścień jak „Baterie”, nazwa i kwota
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                ZStack {
                    Circle().stroke(.quaternary, lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: entry.progress)
                        .stroke(.green, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Image(systemName: "bicycle")
                        .font(.system(size: 20, weight: .semibold))
                }
                .frame(width: 58, height: 58)
                Spacer(minLength: 0)
                Text(entry.goalName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                Text(Money.formatShort(entry.saved))
                    .font(.title3.weight(.bold).monospacedDigit())
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text(verbatim: "\(entry.percentNumber)% · \(L10n.tr("widget.of", Money.formatShort(entry.target)))")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

        // Średni: zdjęcie e-bike'a, nazwa, zebrane, brakuje i pasek
        default:
            HStack(spacing: 14) {
                Group {
                    if let data = entry.thumbnail, let image = UIImage(data: data) {
                        Image(uiImage: image).resizable().scaledToFill()
                    } else {
                        Image(systemName: "bicycle")
                            .font(.system(size: 34, weight: .semibold))
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(.quaternary)
                    }
                }
                .frame(width: 104, height: 104)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.goalName)
                        .font(.headline)
                        .lineLimit(1)
                    Text(Money.formatShort(entry.saved))
                        .font(.title2.weight(.bold).monospacedDigit())
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(verbatim: L10n.tr("widget.left", Money.formatShort(entry.remaining)))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                    ProgressView(value: entry.progress)
                        .tint(.green)
                    Text(verbatim: "\(entry.percentNumber)% · \(L10n.tr("widget.of", Money.formatShort(entry.target)))")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

#Preview(as: .accessoryCircular) {
    SavingsWidget()
} timeline: {
    SavingsEntry.placeholder
}

#Preview(as: .systemSmall) {
    SavingsWidget()
} timeline: {
    SavingsEntry.placeholder
}

#Preview(as: .systemMedium) {
    SavingsWidget()
} timeline: {
    SavingsEntry.placeholder
}
