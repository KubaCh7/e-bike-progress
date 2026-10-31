import SwiftUI

/// Szklany baner "Dostępna nowa wersja" (dane z Supabase: app_config.ios_update).
struct UpdateBanner: View {
    @Environment(UpdateChecker.self) private var updates
    @Environment(\.openURL) private var openURL

    var body: some View {
        if updates.isUpdateAvailable {
            HStack(spacing: 12) {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.tint)
                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.tr("update.available")).font(.headline)
                    Text(updates.notes ?? L10n.tr("update.hint"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
                if let url = updates.updateURL {
                    Button(L10n.tr("update.install")) { openURL(url) }
                        .buttonStyle(.glassProminent)
                }
            }
            .padding(14)
            .glassEffect(.clear, in: .rect(cornerRadius: 26))
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}
