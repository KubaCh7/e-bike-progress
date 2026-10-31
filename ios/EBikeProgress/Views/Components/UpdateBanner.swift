import SwiftUI
import UIKit

/// Baner "Dostępna nowa wersja" (dane z Supabase: app_config.ios_update).
/// Z TestFlight otwiera sklep; bez niego pokazuje krótką instrukcję aktualizacji.
struct UpdateBanner: View {
    @Environment(UpdateChecker.self) private var updates
    @Environment(\.openURL) private var openURL
    @State private var showGuide = false

    var body: some View {
        if updates.isUpdateAvailable {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.tr("update.available")).font(.headline)
                    Text(updates.notes ?? L10n.tr("update.hint"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
                Button(L10n.tr("update.install")) {
                    if let url = updates.updateURL { openURL(url) } else { showGuide = true }
                }
                .buttonStyle(.primaryFlat)
            }
            .padding(14)
            .card()
            .sheet(isPresented: $showGuide) { UpdateGuideView() }
        }
    }
}

/// Instrukcja aktualizacji aplikacji zainstalowanej z Xcode (bez TestFlight).
struct UpdateGuideView: View {
    @Environment(UpdateChecker.self) private var updates
    @Environment(\.dismiss) private var dismiss
    @State private var copied = false

    static let command = "cd ~/Documents/e-bike-progress && git pull"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(L10n.tr("update.guide.versions", "\(updates.currentBuild)", "\(updates.latestBuild ?? updates.currentBuild)"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    step(1, L10n.tr("update.guide.step1"))
                    step(2, L10n.tr("update.guide.step2"))

                    HStack {
                        Text(verbatim: Self.command)
                            .font(.footnote.monospaced())
                            .lineLimit(2)
                        Spacer(minLength: 8)
                        Button(copied ? L10n.tr("update.guide.copied") : L10n.tr("update.guide.copy")) {
                            UIPasteboard.general.string = Self.command
                            copied = true
                        }
                        .buttonStyle(.secondaryFlat)
                    }
                    .padding(12)
                    .card()

                    step(3, L10n.tr("update.guide.step3"))
                    step(4, L10n.tr("update.guide.step4"))

                    Text(L10n.tr("update.guide.note"))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(L10n.tr("update.available"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.tr("common.done")) { dismiss() }
                }
            }
        }
    }

    private func step(_ number: Int, _ text: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(verbatim: "\(number).")
                .font(.body.weight(.semibold).monospacedDigit())
            Text(text)
                .font(.body)
        }
    }
}
