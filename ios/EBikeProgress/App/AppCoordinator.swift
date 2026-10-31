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
    let profile: ProfileStore
    let catalog: CatalogStore
    let updates: UpdateChecker

    init(inMemory: Bool = false) {
        container = PersistenceController.makeContainer(inMemory: inMemory)
        repository = GoalRepository(context: container.mainContext)
        goals = GoalsViewModel(repository: repository)
        auth = AuthViewModel()
        sync = SyncService(repository: repository)
        network = NetworkMonitor()
        watch = PhoneConnectivity()
        profile = ProfileStore()
        catalog = CatalogStore()
        updates = UpdateChecker()

        // lokalna zmiana → wyślij na serwer (z opóźnieniem)
        goals.onDataChanged = { [weak self] in
            self?.dataChanged(local: true)
        }
        // zmiany z serwera → odśwież widoki
        sync.onRemoteChanges = { [weak self] in
            self?.dataChanged(local: false)
        }
        auth.onSignedIn = { [weak self] in
            guard let self else { return }
            Task {
                await self.sync.sync()
                if case .signedIn(let userID, _) = self.auth.state {
                    await self.profile.activate(userID: userID, hasGoals: !self.goals.goals.isEmpty)
                }
            }
        }
        auth.onSignedOut = { [weak self] in
            guard let self else { return }
            self.sync.resetLocalData()
            Task { await self.profile.activate(userID: nil, hasGoals: false) }
        }
        network.onReconnect = { [weak self] in
            self?.sync.scheduleSync(delay: .milliseconds(300))
        }
        watch.snapshotProvider = { [weak self] in
            self?.makeWatchSnapshot()
        }
        watch.widgetPhotoProvider = { [weak self] in
            guard let goal = self?.goals.defaultGoal ?? self?.goals.goals.first, let image = goal.uiImage else { return (nil, nil) }
            return (ImageProcessor.jpeg(image, maxDimension: 700, quality: 0.8), goal.photoPosition)
        }
        watch.depositHandler = { [weak self] deposit in
            self?.addDepositFromWatch(deposit) ?? false
        }
    }

    func start() {
        auth.start()
        network.start()
        watch.start()
        Task {
            // tryb bez konta / brak konfiguracji Supabase – profil lokalny
            if !auth.isConfigured || auth.offlineMode {
                await profile.activate(userID: nil, hasGoals: !goals.goals.isEmpty)
            }
            await catalog.refresh()
            await updates.check()
        }
    }

    /// Aplikacja wróciła na pierwszy plan.
    func becameActive() {
        sync.scheduleSync(delay: .milliseconds(200))
        Task { await updates.check() }
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
