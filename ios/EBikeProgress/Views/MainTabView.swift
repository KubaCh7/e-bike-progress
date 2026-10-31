import SwiftUI

/// Zakładki aplikacji – natywny TabView dostaje szklany pasek automatycznie (iOS 26).
struct MainTabView: View {
    @Binding var selection: AppTab

    var body: some View {
        TabView(selection: $selection) {
            Tab(L10n.tr("tab.home"), image: "MotoIcon", value: AppTab.home) {
                HomeView()
            }
            Tab(L10n.tr("tab.history"), systemImage: "list.bullet.rectangle", value: AppTab.history) {
                HistoryView()
            }
            Tab(L10n.tr("tab.stats"), systemImage: "chart.xyaxis.line", value: AppTab.stats) {
                StatsView()
            }
            Tab(L10n.tr("tab.settings"), systemImage: "gearshape", value: AppTab.settings) {
                SettingsView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        // czarno-białe zakładki (w ciemnym motywie białe)
        .tint(.primary)
    }
}
