import SwiftUI
import SwiftData

@main
struct EBikeProgressApp: App {
    let container = PersistenceController.makeContainer()

    var body: some Scene {
        WindowGroup {
            Text(AppConstants.defaultGoalName)
        }
        .modelContainer(container)
    }
}
