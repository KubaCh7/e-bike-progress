import SwiftUI

/// Korzeń interfejsu: motyw, język (zmiana od razu, bez restartu) i zakładki.
struct RootView: View {
    @AppStorage(SettingsKey.language) private var language: AppLanguage = .pl
    @AppStorage(SettingsKey.theme) private var theme: AppTheme = .system
    @State private var selectedTab: AppTab = .home

    var body: some View {
        MainTabView(selection: $selectedTab)
            // nowe id przebudowuje widoki, więc wszystkie teksty od razu biorą nowy język
            .id(language)
            .environment(\.locale, language.locale)
            .preferredColorScheme(theme.colorScheme)
            .animation(.smooth, value: theme)
    }
}
