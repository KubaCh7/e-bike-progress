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
    let watch: PhoneConnectivity

    init(inMemory: Bool = false) {
        container = PersistenceController.makeContainer(inMemory: inMemory)
        repository = GoalRepository(context: container.mainContext)
        goals = GoalsViewModel(repository: repository)
        auth = AuthViewModel()
        sync = SyncService(repository: repository)
        network = NetworkMonitor()
        watch = PhoneConnectivity()

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
        watch.snapshotProvider = { [weak self] in
            self?.makeWatchSnapshot()
        }
        watch.depositHandler = { [weak self] deposit in
            self?.addDepositFromWatch(deposit) ?? false
        }
    }

    func start() {
        auth.start()
        network.start()
        watch.start()
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
        watch.pushSnapshot()
    }

    // MARK: - Apple Watch

    /// Stan głównego celu dla zegarka i komplikacji.
    func makeWatchSnapshot() -> WatchSnapshot? {
        guard let goal = goals.defaultGoal ?? goals.goals.first else { return nil }
        let recent = goal.sortedDeposits.prefix(10).map {
            WatchDeposit(id: $0.id, amount: $0.amount, date: $0.date, note: $0.note)
        }
        return WatchSnapshot(
            goalID: goal.id,
            goalName: goal.name,
            target: goal.targetAmount,
            saved: goal.stats.total,
            thumbnail: goal.thumbnailData ?? (goal.isSuggestedPhoto ? ImageProcessor.suggestedThumbnail() : nil),
            recent: Array(recent),
            processedWatchIDs: [],
            language: L10n.current.rawValue,
            updatedAt: .now
        )
    }

    /// Wpłata dodana na zegarku trafia do głównego celu (lub wskazanego).
    private func addDepositFromWatch(_ deposit: WatchNewDeposit) -> Bool {
        guard deposit.amount > 0, repository.deposit(id: deposit.id) == nil else { return true }
        let goal = deposit.goalID.flatMap { repository.goal(id: $0) }.flatMap { $0.pendingDelete ? nil : $0 }
            ?? goals.defaultGoal ?? goals.goals.first
        guard let goal else { return false }
        repository.addDeposit(to: goal, amount: deposit.amount, date: deposit.date, note: nil, id: deposit.id)
        return true
    }
}
