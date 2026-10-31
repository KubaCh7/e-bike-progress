import SwiftUI
import SwiftData

@main
struct EBikeProgressApp: App {
    @State private var container: ModelContainer
    @State private var goalsViewModel: GoalsViewModel

    init() {
        let container = PersistenceController.makeContainer()
        let repository = GoalRepository(context: container.mainContext)
        _container = State(initialValue: container)
        _goalsViewModel = State(initialValue: GoalsViewModel(repository: repository))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(goalsViewModel)
        }
        .modelContainer(container)
    }
}
