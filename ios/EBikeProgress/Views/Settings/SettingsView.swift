import SwiftUI

/// Zakładki ustawień.
enum SettingsSection: String, CaseIterable, Identifiable {
    case profile, goals, appearance, account
    var id: String { rawValue }
    var title: String { L10n.tr("settings.section.\(rawValue)") }
}

/// Ustawienia: profil (imię), cele i kwota, wygląd (motyw, język), konto i aktualizacje.
/// Zakładki przełącza natywny segmented picker – w iOS 26 ze szklaną, przesuwaną pastylką.
struct SettingsView: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(ProfileStore.self) private var profile
    @Environment(UpdateChecker.self) private var updates
    @Environment(\.openURL) private var openURL
    @State private var section: SettingsSection = .profile
    @State private var nameDraft = ""
    @State private var confirmDeleteAccount = false
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
                switch section {
                case .profile:
                    profileSection
                case .goals:
                    goalSection
                case .appearance:
                    appearanceSection
                    languageSection
                case .account:
                    accountSection
                    aboutSection
                }
            }
            .contentTransition(.opacity)
            .animation(.smooth, value: section)
            .safeAreaInset(edge: .top) {
                Picker(L10n.tr("settings.title"), selection: $section) {
                    ForEach(SettingsSection.allCases) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.bottom, 6)
            }
            .scrollContentBackground(.hidden)
            .background(GlassBackground())
            .navigationTitle(L10n.tr("settings.title"))
            .sheet(isPresented: $showManager) { GoalsManagerView() }
            .onAppear {
                model.load(from: goals.currentGoal)
                nameDraft = profile.displayName ?? ""
            }
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
                Button(L10n.tr("account.delete"), systemImage: "trash", role: .destructive) {
                    confirmDeleteAccount = true
                }
                .confirmationDialog(L10n.tr("account.deleteConfirm"), isPresented: $confirmDeleteAccount, titleVisibility: .visible) {
                    Button(L10n.tr("account.deleteYes"), role: .destructive) {
                        Task { _ = await auth.deleteAccount() }
                    }
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

    private var profileSection: some View {
        Section {
            TextField(L10n.tr("profile.namePlaceholder"), text: $nameDraft)
                .textContentType(.givenName)
                .submitLabel(.done)
                .onSubmit(saveName)
            if nameDraft.trimmingCharacters(in: .whitespaces) != (profile.displayName ?? "") && !nameDraft.trimmingCharacters(in: .whitespaces).isEmpty {
                Button(L10n.tr("common.save"), systemImage: "checkmark", action: saveName)
                    .buttonStyle(.glassProminent)
            }
        } header: {
            Text(L10n.tr("profile.name"))
        } footer: {
            Text(L10n.tr("profile.footer"))
        }
    }

    private func saveName() {
        let trimmed = nameDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        Task { await profile.setName(trimmed) }
    }

    private var aboutSection: some View {
        Section {
            LabeledContent(L10n.tr("settings.version"), value: Bundle.main.appVersion)
            Link(L10n.tr("legal.privacy"), destination: LegalLinks.privacy)
            Link(L10n.tr("legal.terms"), destination: LegalLinks.terms)
            Link(L10n.tr("legal.notices"), destination: LegalLinks.notices)
            if updates.isUpdateAvailable, let url = updates.updateURL {
                Button(L10n.tr("update.install"), systemImage: "arrow.down.circle") { openURL(url) }
                    .buttonStyle(.glassProminent)
            } else {
                Button {
                    Task { await updates.check() }
                } label: {
                    HStack {
                        Label(L10n.tr("update.check"), systemImage: "arrow.triangle.2.circlepath")
                        Spacer()
                        if updates.isChecking { ProgressView() } else if updates.lastChecked != nil {
                            Text(L10n.tr("update.upToDate")).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        } header: {
            Text(L10n.tr("settings.about"))
        } footer: {
            Text(L10n.tr("update.footer"))
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

/// Dokumenty prawne (strona web) – polityka prywatności, regulamin, informacje prawne.
enum LegalLinks {
    static let base = "https://e-bike-progress.vercel.app/"
    static let privacy = URL(string: base + "#prywatnosc")!
    static let terms = URL(string: base + "#regulamin")!
    static let notices = URL(string: base + "#informacje")!
}
