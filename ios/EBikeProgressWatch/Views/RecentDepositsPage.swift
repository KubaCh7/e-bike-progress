import SwiftUI

/// Lista ostatnich wpłat (oczekujące na iPhone'a oznaczone zegarem).
struct RecentDepositsPage: View {
    @Environment(WatchViewModel.self) private var model

    var body: some View {
        List {
            if model.recentItems.isEmpty {
                Text(L10n.tr("history.empty"))
                    .foregroundStyle(.secondary)
            }
            ForEach(model.recentItems, id: \.deposit.id) { item in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(Money.format(item.deposit.amount))
                            .font(.body.bold().monospacedDigit())
                        Text(item.deposit.date.formatted(.dateTime.day().month(.abbreviated).locale(L10n.locale)))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if item.isPending {
                        Image(systemName: "clock.arrow.circlepath")
                            .foregroundStyle(.orange)
                            .accessibilityLabel(L10n.tr("watch.pending"))
                    }
                }
            }
        }
        .navigationTitle(L10n.tr("home.recent"))
    }
}
