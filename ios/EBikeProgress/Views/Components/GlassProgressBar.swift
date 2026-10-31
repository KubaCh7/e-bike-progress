import SwiftUI

/// Płaski pasek postępu – wypełnienie w kolorze marki e-bike'a (jedyny kolor na ekranie).
struct GlassProgressBar: View {
    var progress: Double
    var height: CGFloat = 10
    var tint: Color = .primary

    var body: some View {
        GeometryReader { proxy in
            let clamped = min(max(progress, 0), 1)
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2).fill(Color(.tertiarySystemFill))
                RoundedRectangle(cornerRadius: 2)
                    .fill(tint)
                    .frame(width: proxy.size.width * clamped)
                    .animation(.smooth, value: progress)
            }
        }
        .frame(height: height)
        .accessibilityElement()
        .accessibilityValue(Money.percent(progress))
    }
}

/// Kafelek z etykietą i wartością (bez ikon).
struct StatChip: View {
    let title: String
    let value: String
    var systemImage: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline.monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .contentTransition(.numericText())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .card()
    }
}

#Preview {
    VStack {
        GlassProgressBar(progress: 0.42, tint: .orange)
        StatChip(title: "Uzbierane", value: "12 500,00 zł")
    }
    .padding()
    .background(GlassBackground())
}
