import SwiftUI

/// Korzeń interfejsu: logowanie → powitanie (imię + e-bike'i) → zakładki.
/// Motyw i język zmieniają się od razu, bez restartu.
struct RootView: View {
    @AppStorage(SettingsKey.language) private var language: AppLanguage = .pl
    @AppStorage(SettingsKey.theme) private var theme: AppTheme = .system
    @State private var selectedTab: AppTab = .home
    @Environment(AuthViewModel.self) private var auth
    @Environment(ProfileStore.self) private var profile
    @Environment(GoalsViewModel.self) private var goals
    @Environment(PhoneConnectivity.self) private var watch

    var body: some View {
        Group {
            if auth.state == .loading && auth.isConfigured && !auth.offlineMode {
                loading
            } else if auth.needsAuthScreen {
                AuthView()
                    .transition(.opacity)
            } else if !profile.isLoaded {
                loading
            } else if !profile.onboarded {
                OnboardingView()
                    .transition(.opacity)
            } else {
                MainTabView(selection: $selectedTab)
                    .transition(.opacity)
            }
        }
        .animation(.smooth, value: auth.state)
        .animation(.smooth, value: auth.offlineMode)
        .animation(.smooth, value: profile.onboarded)
        // "Kontynuuj bez konta" – profil lokalny
        .task(id: auth.offlineMode) {
            if auth.offlineMode { await profile.activate(userID: nil, hasGoals: !goals.goals.isEmpty) }
        }
        // zegarek pokazuje teksty w tym samym języku co iPhone
        .onChange(of: language) { _, _ in watch.pushSnapshot() }
        // nowe id przebudowuje widoki, więc wszystkie teksty od razu biorą nowy język
        .id(language)
        .environment(\.locale, language.locale)
        .preferredColorScheme(theme.colorScheme)
        .animation(.smooth, value: theme)
    }

    private var loading: some View {
        ZStack {
            GlassBackground()
            ProgressView()
        }
    }
}
