import SwiftUI

/// Pasek postępu na szklanej kapsule.
struct GlassProgressBar: View {
    var progress: Double
    var height: CGFloat = 16

    var body: some View {
        GeometryReader { proxy in
            let width = max(proxy.size.width * min(max(progress, 0), 1), progress > 0 ? height : 0)
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(.primary.opacity(0.06))
                Capsule()
                    .fill(
                        LinearGradient(colors: [.mint, .teal, .indigo], startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: width)
                    .shadow(color: .teal.opacity(0.5), radius: 8)
                    .animation(.spring(duration: 0.8, bounce: 0.25), value: progress)
            }
        }
        .frame(height: height)
        .padding(4)
        .glassEffect(.clear, in: .capsule)
        .accessibilityElement()
        .accessibilityValue(Money.percent(progress))
    }
}

/// Mała szklana "pigułka" z etykietą i wartością.
struct StatChip: View {
    let title: String
    let value: String
    var systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(title, systemImage: systemImage)
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
        .glassEffect(.clear, in: .rect(cornerRadius: 22))
    }
}

#Preview {
    VStack {
        GlassProgressBar(progress: 0.42)
        StatChip(title: "Uzbierane", value: "12 500,00 zł", systemImage: "banknote")
    }
    .padding()
    .background(GlassBackground())
}
