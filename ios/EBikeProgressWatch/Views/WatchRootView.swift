import SwiftUI

/// Strony zegarka: postęp, dodawanie wpłaty, ostatnie wpłaty.
struct WatchRootView: View {
    @Environment(WatchViewModel.self) private var model

    var body: some View {
        TabView {
            ProgressPage()
            AddDepositPage()
            RecentDepositsPage()
        }
        .tabViewStyle(.verticalPage)
        .id(model.language) // zmiana języka na iPhonie przebudowuje teksty
        .environment(\.locale, (AppLanguage(rawValue: model.language) ?? .pl).locale)
        .onAppear { model.refresh() }
    }
}
