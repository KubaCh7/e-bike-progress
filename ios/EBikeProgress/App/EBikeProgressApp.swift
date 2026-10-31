import SwiftUI
import SwiftData

@main
struct EBikeProgressApp: App {
    @State private var coordinator = AppCoordinator()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(coordinator.goals)
                .environment(coordinator.auth)
                .environment(coordinator.sync)
                .environment(coordinator.network)
                .task { coordinator.start() }
        }
        .modelContainer(coordinator.container)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { coordinator.becameActive() }
        }
    }
}
