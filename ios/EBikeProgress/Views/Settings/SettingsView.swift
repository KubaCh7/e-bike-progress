import SwiftUI

/// Ustawienia: język, motyw, cele i kwota celu.
struct SettingsView: View {
    @Environment(GoalsViewModel.self) private var goals
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

    /// Konto i synchronizacja – uzupełniane w etapie synchronizacji.
    @ViewBuilder
    private var accountSection: some View {
        EmptyView()
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
