import WidgetKit
import SwiftUI
import AppIntents

/// Ustawienia widżetu (przytrzymaj widżet → Edytuj widżet).
struct SavingsWidgetIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Zbieram na e-bike"
    static var description = IntentDescription("Nazwa e-bike'a i ile już zebrane.")

    /// Pokaż zdjęcie e-bike'a wgrane w aplikacji (na ekranie początkowym i na Macu).
    @Parameter(title: "Pokaż zdjęcie e-bike'a", default: true)
    var showPhoto: Bool
}

/// Stan głównego celu dla widżetu – czytany z App Group (zapisuje go aplikacja na iPhonie).
struct SavingsEntry: TimelineEntry {
    let date: Date
    let goalName: String
    let saved: Decimal
    let target: Decimal
    let thumbnail: Data?
    var photo: Data? = nil
    var photoPosition: String? = nil
    var showPhoto: Bool = true

    var progress: Double { target > 0 ? min(max((saved / target).doubleValue, 0), 1) : 0 }
    var remaining: Decimal { max(target - saved, 0) }
    var percentNumber: Int { Int((progress * 100).rounded()) }

    static let placeholder = SavingsEntry(date: .now, goalName: AppConstants.defaultGoalName, saved: 12_600, target: 30_000, thumbnail: nil)

    static func current(showPhoto: Bool = true) -> SavingsEntry {
        guard let snapshot = SnapshotStore.load() else { return .placeholder }
        return SavingsEntry(
            date: .now,
            goalName: snapshot.goalName,
            saved: snapshot.saved,
            target: snapshot.target,
            thumbnail: snapshot.thumbnail,
            photo: showPhoto ? (WidgetPhotoStore.load() ?? snapshot.thumbnail) : nil,
            photoPosition: WidgetPhotoStore.position,
            showPhoto: showPhoto
        )
    }

    /// Zdjęcie do pokazania (nil, gdy wyłączone w ustawieniach widżetu albo go nie ma).
    var image: UIImage? {
        guard showPhoto, let photo else { return nil }
        return UIImage(data: photo)
    }
}

struct SavingsProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SavingsEntry { .placeholder }

    func snapshot(for configuration: SavingsWidgetIntent, in context: Context) async -> SavingsEntry {
        context.isPreview ? .placeholder : .current(showPhoto: configuration.showPhoto)
    }

    func timeline(for configuration: SavingsWidgetIntent, in context: Context) async -> Timeline<SavingsEntry> {
        // aplikacja przeładowuje widżety po każdej wpłacie; dodatkowo co godzinę
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
        return Timeline(entries: [.current(showPhoto: configuration.showPhoto)], policy: .after(next))
    }
}

struct SavingsWidget: Widget {
    let kind = "SavingsWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SavingsWidgetIntent.self, provider: SavingsProvider()) { entry in
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
                Image("MotoIcon")
            } currentValueLabel: {
                Image("MotoIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 27)
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

        // Ekran początkowy / biurko Maca – mały: zdjęcie (jeśli włączone) albo pierścień, nazwa i kwota
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                if let image = entry.image {
                    WidgetPhoto(image: image, position: entry.photoPosition)
                        .frame(maxWidth: .infinity)
                        .frame(height: 62)
                        .clipShape(.rect(cornerRadius: 10))
                } else {
                    ring.frame(width: 58, height: 58)
                }
                Spacer(minLength: 0)
                Text(entry.goalName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(entry.image == nil ? 2 : 1)
                    .minimumScaleFactor(0.8)
                Text(Money.formatShort(entry.saved))
                    .font(.title3.weight(.bold).monospacedDigit())
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                if entry.image != nil {
                    ProgressView(value: entry.progress).tint(.primary)
                }
                Text(verbatim: "\(entry.percentNumber)% · \(L10n.tr("widget.of", Money.formatShort(entry.target)))")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

        // Średni: zdjęcie e-bike'a (albo pierścień), nazwa, zebrane, brakuje i pasek
        default:
            HStack(spacing: 14) {
                if let image = entry.image {
                    WidgetPhoto(image: image, position: entry.photoPosition)
                        .frame(width: 120, height: 104)
                        .clipShape(.rect(cornerRadius: 12))
                } else {
                    ring.frame(width: 84, height: 84)
                }

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
                        .tint(.primary)
                    Text(verbatim: "\(entry.percentNumber)% · \(L10n.tr("widget.of", Money.formatShort(entry.target)))")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// Pierścień postępu z ikoną e-crossa (jak widżet „Baterie”).
    private var ring: some View {
        ZStack {
            Circle().stroke(.quaternary, lineWidth: 6)
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(.primary, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Image("MotoIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 30)
        }
    }
}

/// Zdjęcie wypełniające ramkę z kadrem „x% y%” ustawionym w aplikacji / na stronie.
struct WidgetPhoto: View {
    let image: UIImage
    var position: String?

    var body: some View {
        GeometryReader { proxy in
            let frame = proxy.size
            let size = image.size
            let scale = max(frame.width / max(size.width, 1), frame.height / max(size.height, 1))
            let width = size.width * scale
            let height = size.height * scale
            let parts = (position ?? "").split(separator: " ").compactMap { Double($0.replacingOccurrences(of: "%", with: "")) }
            let px = parts.count == 2 ? min(max(parts[0], 0), 100) : 50
            let py = parts.count == 2 ? min(max(parts[1], 0), 100) : 50
            Image(uiImage: image)
                .resizable()
                .frame(width: width, height: height)
                .offset(x: -(width - frame.width) * px / 100, y: -(height - frame.height) * py / 100)
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
