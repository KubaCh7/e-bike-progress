import SwiftUI

/// Korzeń interfejsu: motyw, język (zmiana od razu, bez restartu) i zakładki.
struct RootView: View {
    @AppStorage(SettingsKey.language) private var language: AppLanguage = .pl
    @AppStorage(SettingsKey.theme) private var theme: AppTheme = .system
    @State private var selectedTab: AppTab = .home
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        Group {
            if auth.state == .loading && auth.isConfigured && !auth.offlineMode {
                ZStack {
                    GlassBackground()
                    ProgressView()
                }
            } else if auth.needsAuthScreen {
                AuthView()
                    .transition(.opacity)
            } else {
                MainTabView(selection: $selectedTab)
                    .transition(.opacity)
            }
        }
        .animation(.smooth, value: auth.state)
        .animation(.smooth, value: auth.offlineMode)
            // nowe id przebudowuje widoki, więc wszystkie teksty od razu biorą nowy język
            .id(language)
            .environment(\.locale, language.locale)
            .preferredColorScheme(theme.colorScheme)
            .animation(.smooth, value: theme)
    }
}
