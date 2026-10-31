import Foundation
import SwiftData

/// Warstwa dostępu do danych lokalnych (SwiftData). Każda zmiana oznacza
/// rekord do synchronizacji i powiadamia obserwatorów (sync, zegarek).
@MainActor
final class GoalRepository {
    let context: ModelContext
    /// Wywoływane po każdej lokalnej zmianie.
    var onChange: (() -> Void)?

    init(context: ModelContext) {
        self.context = context
    }

    // MARK: - Odczyt

    /// Wszystkie aktywne cele (główny pierwszy, potem wg daty utworzenia).
    func fetchGoals() -> [Goal] {
        let descriptor = FetchDescriptor<Goal>(
            predicate: #Predicate { !$0.pendingDelete },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        let goals = (try? context.fetch(descriptor)) ?? []
        return goals.sorted { $0.isDefault && !$1.isDefault }
    }

    func goal(id: UUID) -> Goal? {
        let descriptor = FetchDescriptor<Goal>(predicate: #Predicate { $0.id == id })
        return try? context.fetch(descriptor).first
    }

    func deposit(id: UUID) -> Deposit? {
        let descriptor = FetchDescriptor<Deposit>(predicate: #Predicate { $0.id == id })
        return try? context.fetch(descriptor).first
    }

    func allGoalsIncludingDeleted() -> [Goal] {
        (try? context.fetch(FetchDescriptor<Goal>())) ?? []
    }

    // MARK: - Pierwsze uruchomienie

    /// Tworzy cel "e-ride pro SR" za 30 000 zł, jeśli nie ma jeszcze żadnego celu
    /// (np. gdy użytkownik pominie wybór e-bike'a na ekranie powitalnym).
    @discardableResult
    func seedDefaultGoalIfNeeded() -> Goal? {
        guard fetchGoals().isEmpty else { return nil }
        let goal = Goal(
            name: AppConstants.defaultGoalName,
            targetAmount: AppConstants.defaultGoalTarget,
            photoURL: AppConstants.suggestedPhotoURL,
            isDefault: true,
            seedKey: AppConstants.defaultGoalSeedKey
        )
        context.insert(goal)
        save()
        return goal
    }

    // MARK: - Cele

    @discardableResult
    func createGoal(name: String, target: Decimal, photo: Data?, thumbnail: Data?, photoURL: String?, makeDefault: Bool, catalogId: String? = nil) -> Goal {
        let goal = Goal(
            name: name,
            targetAmount: target,
            photoURL: photoURL,
            seedKey: catalogId == AppConstants.defaultCatalogId ? AppConstants.defaultGoalSeedKey : nil,
            catalogId: catalogId
        )
        goal.photoData = photo
        goal.thumbnailData = thumbnail
        goal.photoNeedsUpload = photo != nil
        context.insert(goal)
        if makeDefault || fetchGoals().filter({ $0.isDefault }).isEmpty {
            setDefault(goal, notify: false)
        }
        commit()
        return goal
    }

    func updateGoal(_ goal: Goal, name: String, target: Decimal) {
        goal.name = name
        goal.targetAmount = target
        touch(goal)
        commit()
    }

    /// Ustawia zdjęcie z galerii/aparatu (już skompresowane).
    func setPhoto(_ goal: Goal, data: Data, thumbnail: Data?) {
        goal.photoData = data
        goal.thumbnailData = thumbnail
        goal.photoNeedsUpload = true
        touch(goal)
        commit()
    }

    /// Przełącza na sugerowane zdjęcie z Assets.
    func useSuggestedPhoto(_ goal: Goal, thumbnail: Data?) {
        goal.photoURL = AppConstants.suggestedPhotoURL
        goal.photoData = nil
        goal.thumbnailData = thumbnail
        goal.photoNeedsUpload = false
        touch(goal)
        commit()
    }

    func removePhoto(_ goal: Goal) {
        goal.photoURL = nil
        goal.photoData = nil
        goal.thumbnailData = nil
        goal.photoNeedsUpload = false
        touch(goal)
        commit()
    }

    func setDefault(_ goal: Goal, notify: Bool = true) {
        for other in fetchGoals() where other.isDefault != (other.id == goal.id) {
            other.isDefault = other.id == goal.id
            touch(other)
        }
        if !goal.isDefault {
            goal.isDefault = true
            touch(goal)
        }
        if notify { commit() }
    }

    func deleteGoal(_ goal: Goal) {
        let wasDefault = goal.isDefault
        if goal.everSynced {
            // usunięcie "miękkie" – serwer dowie się przy synchronizacji
            goal.pendingDelete = true
            goal.isDefault = false
            for deposit in goal.deposits ?? [] {
                deposit.pendingDelete = true
                deposit.needsSync = false // serwer usunie wpłaty sam (trigger)
            }
            touch(goal)
        } else {
            context.delete(goal)
        }
        if wasDefault, let next = fetchGoals().first(where: { $0.id != goal.id }) {
            setDefault(next, notify: false)
        }
        commit()
    }

    // MARK: - Wpłaty

    @discardableResult
    func addDeposit(to goal: Goal, amount: Decimal, date: Date, note: String?, id: UUID = UUID()) -> Deposit {
        let deposit = Deposit(id: id, amount: amount, date: date, note: note?.nilIfBlank, goal: goal)
        context.insert(deposit)
        commit()
        return deposit
    }

    func updateDeposit(_ deposit: Deposit, amount: Decimal, date: Date, note: String?) {
        deposit.amount = amount
        deposit.date = Calendar.current.startOfDay(for: date)
        deposit.note = note?.nilIfBlank
        deposit.updatedAt = .now
        deposit.needsSync = true
        commit()
    }

    func deleteDeposit(_ deposit: Deposit) {
        if deposit.everSynced {
            deposit.pendingDelete = true
            deposit.needsSync = true
            deposit.updatedAt = .now
        } else {
            context.delete(deposit)
        }
        commit()
    }

    // MARK: - Pomocnicze

    func touch(_ goal: Goal) {
        goal.updatedAt = .now
        goal.needsSync = true
    }

    func save() {
        do {
            try context.save()
        } catch {
            print("SwiftData save error: \(error)")
        }
    }

    /// Zapis + powiadomienie (synchronizacja, zegarek).
    func commit() {
        save()
        onChange?()
    }
}

extension String {
    /// nil dla pustego / samych spacji.
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
