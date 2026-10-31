import SwiftUI
import SwiftData

/// Spina wszystkie serwisy: dane lokalne, logowanie, synchronizację, sieć.
@MainActor
final class AppCoordinator {
    let container: ModelContainer
    let repository: GoalRepository
    let goals: GoalsViewModel
    let auth: AuthViewModel
    let sync: SyncService
    let network: NetworkMonitor

    init(inMemory: Bool = false) {
        container = PersistenceController.makeContainer(inMemory: inMemory)
        repository = GoalRepository(context: container.mainContext)
        goals = GoalsViewModel(repository: repository)
        auth = AuthViewModel()
        sync = SyncService(repository: repository)
        network = NetworkMonitor()

        // lokalna zmiana → wyślij na serwer (z opóźnieniem)
        goals.onDataChanged = { [weak self] in
            self?.dataChanged(local: true)
        }
        // zmiany z serwera → odśwież widoki
        sync.onRemoteChanges = { [weak self] in
            self?.dataChanged(local: false)
        }
        auth.onSignedIn = { [weak self] in
            Task { await self?.sync.sync() }
        }
        auth.onSignedOut = { [weak self] in
            self?.sync.resetLocalData()
        }
        network.onReconnect = { [weak self] in
            self?.sync.scheduleSync(delay: .milliseconds(300))
        }
    }

    func start() {
        auth.start()
        network.start()
    }

    /// Aplikacja wróciła na pierwszy plan.
    func becameActive() {
        sync.scheduleSync(delay: .milliseconds(200))
    }

    private func dataChanged(local: Bool) {
        if local {
            sync.scheduleSync()
        } else {
            goals.reload()
        }
    }
}
