import Foundation
import SwiftData

/// Tworzy kontener SwiftData (lokalny cache danych).
enum PersistenceController {
    static func makeContainer(inMemory: Bool = false) -> ModelContainer {
        let schema = Schema([Goal.self, Deposit.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: inMemory)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Nie udało się utworzyć ModelContainer: \(error)")
        }
    }

    /// Kontener z przykładowymi danymi do podglądów (#Preview).
    @MainActor
    static var preview: ModelContainer {
        let container = makeContainer(inMemory: true)
        let context = container.mainContext
        let goal = Goal(
            name: AppConstants.defaultGoalName,
            targetAmount: AppConstants.defaultGoalTarget,
            photoURL: AppConstants.suggestedPhotoURL,
            isDefault: true,
            seedKey: AppConstants.defaultGoalSeedKey
        )
        context.insert(goal)
        let calendar = Calendar.current
        for (offset, amount) in [(-75, 2000), (-60, 1500), (-41, 2500), (-20, 1000), (-3, 1800)] {
            let date = calendar.date(byAdding: .day, value: offset, to: .now)!
            context.insert(Deposit(amount: Decimal(amount), date: date, note: nil, goal: goal))
        }
        return container
    }
}
