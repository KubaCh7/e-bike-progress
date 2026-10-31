import SwiftUI

/// Ustawienia: język, motyw, cele i kwota celu.
struct SettingsView: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(AuthViewModel.self) private var auth
    @Environment(SyncService.self) private var sync
    @Environment(NetworkMonitor.self) private var network
    @AppStorage(SettingsKey.language) private var language: AppLanguage = .pl
    @AppStorage(SettingsKey.theme) private var theme: AppTheme = .system
    @State private var model = SettingsViewModel()
    @State private var showManager = false
    @FocusState private var targetFocused: Bool

    var body: some View {
        NavigationStack {
            Form {
                appearanceSection
                languageSection
                goalSection
                accountSection
                aboutSection
            }
            .scrollContentBackground(.hidden)
            .background(GlassBackground())
            .navigationTitle(L10n.tr("settings.title"))
            .sheet(isPresented: $showManager) { GoalsManagerView() }
            .onAppear { model.load(from: goals.currentGoal) }
            .onChange(of: goals.currentGoal?.id) { _, _ in model.load(from: goals.currentGoal) }
        }
    }

    private var appearanceSection: some View {
        Section(L10n.tr("settings.appearance")) {
            Picker(L10n.tr("settings.theme"), selection: $theme) {
                ForEach(AppTheme.allCases) { option in
                    Label(option.title, systemImage: option.systemImage).tag(option)
                }
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
        }
    }

    private var languageSection: some View {
        Section {
            Picker(L10n.tr("settings.language"), selection: $language) {
                ForEach(AppLanguage.allCases) { option in
                    Text(option.displayName).tag(option)
                }
            }
        } header: {
            Text(L10n.tr("settings.language"))
        } footer: {
            Text(L10n.tr("settings.languageFooter"))
        }
    }

    private var goalSection: some View {
        Section {
            HStack {
                Text(L10n.tr("settings.targetAmount"))
                Spacer()
                TextField("30 000,00", text: $model.targetText)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .monospacedDigit()
                    .focused($targetFocused)
                    .frame(maxWidth: 160)
                Text("zł").foregroundStyle(.secondary)
            }
            if model.canSave(goal: goals.currentGoal) {
                Button(L10n.tr("common.save"), systemImage: "checkmark") {
                    model.saveTarget(goal: goals.currentGoal, using: goals)
                    targetFocused = false
                }
                .buttonStyle(.glassProminent)
            }
            Button(L10n.tr("settings.manageGoals"), systemImage: "list.bullet") { showManager = true }
        } header: {
            Text(L10n.tr("settings.goal"))
        } footer: {
            Text(L10n.tr("settings.targetFooter", goals.currentGoal?.name ?? "—"))
        }
    }

    /// Konto i synchronizacja z Supabase.
    @ViewBuilder
    private var accountSection: some View {
        Section {
            if !auth.isConfigured {
                Label(L10n.tr("sync.notConfigured"), systemImage: "externaldrive.badge.xmark")
                    .foregroundStyle(.secondary)
            } else if auth.isSignedIn {
                LabeledContent(L10n.tr("auth.account"), value: auth.userEmail ?? "Apple ID")
                LabeledContent(L10n.tr("sync.status")) {
                    syncStatusLabel
                }
                Button(L10n.tr("sync.now"), systemImage: "arrow.triangle.2.circlepath") {
                    Task { await sync.sync() }
                }
                .disabled(sync.status == .syncing)
                Button(L10n.tr("auth.signOut"), systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) {
                    Task { await auth.signOut() }
                }
            } else {
                Text(L10n.tr("auth.offlineHint"))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button(L10n.tr("auth.signIn"), systemImage: "person.crop.circle") {
                    auth.showSignIn()
                }
            }
        } header: {
            Text(L10n.tr("settings.account"))
        } footer: {
            if let date = sync.lastSyncDate, auth.isSignedIn {
                Text(L10n.tr("sync.lastSync", date.formatted(.relative(presentation: .named).locale(L10n.locale))))
            }
        }
    }

    @ViewBuilder
    private var syncStatusLabel: some View {
        if !network.isOnline {
            Label(L10n.tr("sync.offline"), systemImage: "wifi.slash").foregroundStyle(.orange)
        } else {
            switch sync.status {
            case .syncing:
                HStack(spacing: 6) { ProgressView(); Text(L10n.tr("sync.syncing")) }
            case .failed:
                Label(L10n.tr("sync.failed"), systemImage: "exclamationmark.triangle").foregroundStyle(.red)
            case .offline:
                Label(L10n.tr("sync.offline"), systemImage: "wifi.slash").foregroundStyle(.orange)
            case .idle, .notSignedIn:
                Label(L10n.tr("sync.ok"), systemImage: "checkmark.icloud").foregroundStyle(.green)
            }
        }
    }

    private var aboutSection: some View {
        Section(L10n.tr("settings.about")) {
            LabeledContent(L10n.tr("settings.version"), value: Bundle.main.appVersion)
        }
    }
}

extension Bundle {
    var appVersion: String {
        let version = object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }
}
