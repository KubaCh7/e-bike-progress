import SwiftUI

/// Dodawanie wpłaty: Digital Crown lub szybkie przyciski, data = dziś.
struct AddDepositPage: View {
    @Environment(WatchViewModel.self) private var model

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: 8) {
                Text(Money.formatShort(model.amountDecimal))
                    .font(.system(size: 30, weight: .bold, design: .rounded).monospacedDigit())
                    .contentTransition(.numericText(value: model.amount))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .glassEffect(.clear, in: .rect(cornerRadius: 16))
                    .focusable()
                    .digitalCrownRotation(
                        $model.amount,
                        from: WatchViewModel.crownRange.lowerBound,
                        through: WatchViewModel.crownRange.upperBound,
                        by: 10,
                        sensitivity: .medium,
                        isContinuous: false,
                        isHapticFeedbackEnabled: true
                    )
                    .accessibilityHint(L10n.tr("watch.crownHint"))

                GlassEffectContainer(spacing: 6) {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                        ForEach(WatchViewModel.quickAmounts, id: \.self) { value in
                            Button {
                                withAnimation(.snappy) { model.addQuick(value) }
                            } label: {
                                Text(verbatim: "+\(NSDecimalNumber(decimal: value).intValue)")
                                    .font(.caption.bold())
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.glass)
                        }
                        Button {
                            withAnimation(.snappy) { model.resetAmount() }
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                        .accessibilityLabel(L10n.tr("watch.reset"))
                    }
                }

                Button {
                    withAnimation(.bouncy) { model.submit() }
                } label: {
                    Label(L10n.tr("home.addDeposit"), systemImage: "plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(.teal)
                .disabled(model.amountDecimal <= 0)
            }
        }
        .overlay {
            if let confirmation = model.confirmation {
                Label(confirmation, systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .padding()
                    .glassEffect(.clear.tint(.green.opacity(0.4)), in: .rect(cornerRadius: 20))
                    .transition(.scale.combined(with: .opacity))
                    .task {
                        try? await Task.sleep(for: .seconds(1.5))
                        withAnimation { model.confirmation = nil }
                    }
            }
        }
        .sensoryFeedback(.success, trigger: model.confirmation) { _, new in new != nil }
        .navigationTitle(L10n.tr("home.addDeposit"))
    }
}
