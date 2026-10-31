import SwiftUI

/// Zakładki aplikacji – natywny TabView dostaje szklany pasek automatycznie (iOS 26).
struct MainTabView: View {
    var body: some View {
        TabView {
            Tab(L10n.tr("tab.home"), systemImage: "bicycle") {
                HomeView()
            }
            Tab(L10n.tr("tab.history"), systemImage: "list.bullet.rectangle") {
                HistoryView()
            }
            Tab(L10n.tr("tab.stats"), systemImage: "chart.xyaxis.line") {
                StatsView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
    }
}
