import SwiftUI

/// Przycisk "+ Dodaj wpłatę", który rozwija się w szybkie kwoty.
struct QuickAddBar: View {
    var onQuickAmount: (Decimal) -> Void
    var onCustom: () -> Void

    @State private var expanded = false

    private let quickAmounts: [Decimal] = [100, 200, 500]

    var body: some View {
        Group {
            HStack(spacing: 10) {
                if expanded {
                    ForEach(quickAmounts, id: \.self) { amount in
                        Button {
                            onQuickAmount(amount)
                            withAnimation(.bouncy) { expanded = false }
                        } label: {
                            Text(verbatim: "+\(Money.formatShort(amount))")
                                .font(.subheadline.bold().monospacedDigit())
                                .padding(.horizontal, 14)
                                .frame(height: 52)
                                .chipBackground()
                        }
                        .buttonStyle(.plain)
                    }

                    Button {
                        onCustom()
                        withAnimation(.bouncy) { expanded = false }
                    } label: {
                        Image(systemName: "square.and.pencil")
                            .font(.title3.weight(.semibold))
                            .frame(width: 52, height: 52)
                            .circleBackground()
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(L10n.tr("home.otherAmount"))
                }

                Button {
                    withAnimation(.bouncy(duration: 0.45)) { expanded.toggle() }
                } label: {
                    Group {
                        if expanded {
                            Image(systemName: "xmark")
                                .font(.title3.weight(.bold))
                                .frame(width: 52, height: 52)
                        } else {
                            Label(L10n.tr("home.addDeposit"), systemImage: "plus")
                                .font(.headline)
                                .padding(.horizontal, 22)
                                .frame(height: 52)
                        }
                    }
                    .foregroundStyle(Color(.systemBackground))
                    .background(Color.primary, in: .capsule)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(L10n.tr("home.addDeposit"))
            }
        }
        .sensoryFeedback(.selection, trigger: expanded)
    }
}

#Preview {
    QuickAddBar(onQuickAmount: { _ in }, onCustom: {})
        .padding()
        .background(GlassBackground())
}
