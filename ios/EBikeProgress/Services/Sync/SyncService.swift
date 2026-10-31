import Foundation
import SwiftData
import Observation
import Supabase
import UIKit

/// Synchronizacja lokalnego cache (SwiftData) z Supabase.
/// Strategia: najpierw pobieramy zmiany z serwera (przyrostowo po updated_at),
/// potem wysyłamy lokalne zmiany oznaczone `needsSync`. Działa offline –
/// niewysłane rekordy czekają na powrót sieci.
@Observable
@MainActor
final class SyncService {
    enum Status: Equatable {
        case idle, syncing, offline, notSignedIn
        case failed(String)
    }

    private(set) var status: Status = .idle
    private(set) var lastSyncDate: Date?

    /// Wywoływane, gdy synchronizacja zmieniła dane lokalne (odśwież UI, zegarek).
    @ObservationIgnored var onRemoteChanges: (() -> Void)?

    private let repository: GoalRepository
    private let client: SupabaseClient?
    @ObservationIgnored private var scheduledTask: Task<Void, Never>?
    @ObservationIgnored private var isRunning = false
    @ObservationIgnored private var needsAnotherRun = false

    private var context: ModelContext { repository.context }

    init(repository: GoalRepository, client: SupabaseClient? = SupabaseConfig.client) {
        self.repository = repository
        self.client = client
        lastSyncDate = UserDefaults.standard.object(forKey: "lastSyncDate") as? Date
    }

    // MARK: - Planowanie

    /// Synchronizacja z małym opóźnieniem (łączy kilka szybkich zmian w jedną).
    func scheduleSync(delay: Duration = .seconds(1.5)) {
        scheduledTask?.cancel()
        scheduledTask = Task { [weak self] in
            try? await Task.sleep(for: delay)
            guard !Task.isCancelled else { return }
            await self?.sync()
        }
    }

    func sync() async {
        guard !isRunning else {
            needsAnotherRun = true
            return
        }
        isRunning = true
        defer { isRunning = false }

        repeat {
            needsAnotherRun = false
            await runOnce()
        } while needsAnotherRun
    }

    // MARK: - Właściwa synchronizacja

    private func runOnce() async {
        guard let client else { status = .notSignedIn; return }
        guard let session = try? await client.auth.session else {
            status = .notSignedIn
            return
        }
        let userID = session.user.id
        status = .syncing

        do {
            let changedByPull = try await pull(client: client, userID: userID)
            try await push(client: client, userID: userID)
            let changedByPhotos = await downloadMissingPhotos(client: client)

            lastSyncDate = .now
            UserDefaults.standard.set(lastSyncDate, forKey: "lastSyncDate")
            status = .idle
            if changedByPull || changedByPhotos { onRemoteChanges?() }
        } catch let error as URLError where error.code == .notConnectedToInternet || error.code == .networkConnectionLost || error.code == .timedOut {
            status = .offline
        } catch {
            print("Sync error: \(error)")
            status = .failed(error.localizedDescription)
        }
    }

    // MARK: Pobieranie

    private func lastPullKey(_ userID: UUID) -> String { "lastPull.\(userID.uuidString.lowercased())" }

    /// Zwraca true, jeśli zmieniono coś lokalnie.
    private func pull(client: SupabaseClient, userID: UUID) async throws -> Bool {
        let since = UserDefaults.standard.string(forKey: lastPullKey(userID)) ?? "1970-01-01T00:00:00Z"

        let goalRows: [GoalRow] = try await client.from("goals")
            .select()
            .gt("updated_at", value: since)
            .order("updated_at")
            .execute()
            .value
        let depositRows: [DepositRow] = try await client.from("deposits")
            .select()
            .gt("updated_at", value: since)
            .order("updated_at")
            .execute()
            .value

        var changed = false
        for row in goalRows { changed = apply(goalRow: row) || changed }
        repository.save()
        for row in depositRows { changed = apply(depositRow: row) || changed }
        repository.save()

        // zapamiętaj najnowszy updated_at (surowy tekst – bez utraty mikrosekund)
        let newest = (goalRows.compactMap(\.updatedAt) + depositRows.compactMap(\.updatedAt))
            .max { (PGDate.parseTimestamp($0) ?? .distantPast) < (PGDate.parseTimestamp($1) ?? .distantPast) }
        if let newest {
            UserDefaults.standard.set(newest, forKey: lastPullKey(userID))
        }
        return changed
    }

    private func apply(goalRow row: GoalRow) -> Bool {
        if let local = repository.goal(id: row.id) {
            if row.deletedAt != nil {
                context.delete(local)
                return true
            }
            guard !local.needsSync else { return false } // lokalna zmiana wygrywa – zostanie wysłana
            update(local, from: row)
            return true
        }

        guard row.deletedAt == nil else { return false }

        let goal = Goal(
            id: row.id,
            name: row.name,
            targetAmount: row.targetAmount.rounded(scale: 2),
            photoURL: row.photoURL,
            isDefault: row.isDefault,
            createdAt: PGDate.parseTimestamp(row.createdAt) ?? .now,
            seedKey: row.seedKey,
            catalogId: row.catalogID
        )
        goal.needsSync = false
        goal.everSynced = true
        if goal.isSuggestedPhoto { goal.thumbnailData = ImageProcessor.suggestedThumbnail() }
        context.insert(goal)

        // Lokalny cel SR utworzony offline + cel SR z serwera = scalamy (bez duplikatu).
        if let seed = row.seedKey,
           let localSeed = repository.allGoalsIncludingDeleted().first(where: { $0.seedKey == seed && !$0.everSynced && $0.id != row.id }) {
            merge(localSeed: localSeed, into: goal)
        }
        return true
    }

    private func update(_ goal: Goal, from row: GoalRow) {
        goal.name = row.name
        goal.targetAmount = row.targetAmount.rounded(scale: 2)
        goal.isDefault = row.isDefault
        goal.seedKey = row.seedKey
        goal.catalogId = row.catalogID ?? goal.catalogId
        goal.everSynced = true
        if goal.photoURL != row.photoURL {
            goal.photoURL = row.photoURL
            goal.photoData = nil // pobierzemy nowe zdjęcie
            goal.thumbnailData = goal.isSuggestedPhoto ? ImageProcessor.suggestedThumbnail() : nil
        }
        if let updated = row.updatedAt.flatMap(PGDate.parseTimestamp) { goal.updatedAt = updated }
    }

    /// Przenosi wpłaty (i ewentualne zdjęcie) z lokalnego celu SR do celu z serwera.
    private func merge(localSeed: Goal, into remote: Goal) {
        for deposit in Array(localSeed.deposits ?? []) where !deposit.pendingDelete {
            deposit.goal = remote
            deposit.goalID = remote.id
            deposit.needsSync = true
        }
        if let photo = localSeed.photoData {
            remote.photoData = photo
            remote.thumbnailData = localSeed.thumbnailData
            remote.photoNeedsUpload = true
            remote.needsSync = true
        }
        if localSeed.isDefault && !remote.isDefault {
            remote.isDefault = true
            remote.needsSync = true
        }
        repository.save()
        context.delete(localSeed)
    }

    private func apply(depositRow row: DepositRow) -> Bool {
        if let local = repository.deposit(id: row.id) {
            if row.deletedAt != nil {
                context.delete(local)
                return true
            }
            guard !local.needsSync else { return false }
            local.amount = row.amount.rounded(scale: 2)
            local.date = PGDate.parseDay(row.depositDate) ?? local.date
            local.note = row.note
            local.everSynced = true
            return true
        }
        guard row.deletedAt == nil, let goal = repository.goal(id: row.goalID), !goal.pendingDelete else { return false }
        let deposit = Deposit(
            id: row.id,
            amount: row.amount.rounded(scale: 2),
            date: PGDate.parseDay(row.depositDate) ?? .now,
            note: row.note,
            goal: goal
        )
        deposit.createdAt = PGDate.parseTimestamp(row.createdAt) ?? .now
        deposit.needsSync = false
        deposit.everSynced = true
        context.insert(deposit)
        return true
    }

    // MARK: Wysyłanie

    private func push(client: SupabaseClient, userID: UUID) async throws {
        let pendingGoals = ((try? context.fetch(FetchDescriptor<Goal>(predicate: #Predicate { $0.needsSync }))) ?? [])
        let pendingDeposits = ((try? context.fetch(FetchDescriptor<Deposit>(predicate: #Predicate { $0.needsSync }))) ?? [])
        guard !pendingGoals.isEmpty || !pendingDeposits.isEmpty else { return }

        // 1. zdjęcia do Storage
        for goal in pendingGoals where goal.photoNeedsUpload && !goal.pendingDelete {
            guard let data = goal.photoData else { goal.photoNeedsUpload = false; continue }
            let path = "\(userID.uuidString.lowercased())/\(goal.id.uuidString.lowercased()).jpg"
            try await client.storage.from(AppConstants.photoBucket).upload(
                path,
                data: data,
                options: FileOptions(cacheControl: "3600", contentType: "image/jpeg", upsert: true)
            )
            goal.photoURL = path
            goal.photoNeedsUpload = false
        }

        // 2. cele
        if !pendingGoals.isEmpty {
            let rows = pendingGoals.map { goal in
                GoalRow(
                    id: goal.id,
                    userID: userID,
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    photoURL: goal.photoURL,
                    isDefault: goal.isDefault,
                    seedKey: goal.seedKey,
                    catalogID: goal.catalogId,
                    createdAt: PGDate.timestamp(goal.createdAt),
                    updatedAt: nil,
                    deletedAt: goal.pendingDelete ? PGDate.timestamp(.now) : nil
                )
            }
            try await client.from("goals").upsert(rows).execute()
        }

        // 3. wpłaty (cele są już na serwerze)
        let depositsToSend = pendingDeposits.filter { $0.goal?.pendingDelete != true }
        if !depositsToSend.isEmpty {
            let rows = depositsToSend.map { deposit in
                DepositRow(
                    id: deposit.id,
                    userID: userID,
                    goalID: deposit.goalID,
                    amount: deposit.amount,
                    depositDate: PGDate.dayString(deposit.date),
                    note: deposit.note,
                    createdAt: PGDate.timestamp(deposit.createdAt),
                    updatedAt: nil,
                    deletedAt: deposit.pendingDelete ? PGDate.timestamp(.now) : nil
                )
            }
            try await client.from("deposits").upsert(rows).execute()
        }

        // 4. oznacz jako wysłane, usunięte usuń z cache
        for goal in pendingGoals {
            if goal.pendingDelete {
                context.delete(goal)
            } else {
                goal.needsSync = false
                goal.everSynced = true
            }
        }
        for deposit in pendingDeposits {
            if deposit.pendingDelete {
                context.delete(deposit)
            } else {
                deposit.needsSync = false
                deposit.everSynced = true
            }
        }
        repository.save()
    }

    // MARK: Zdjęcia

    private func downloadMissingPhotos(client: SupabaseClient) async -> Bool {
        let goals = repository.fetchGoals().filter {
            $0.photoData == nil && !$0.photoNeedsUpload && ($0.photoURL.map { !$0.hasPrefix("asset:") } ?? false)
        }
        var changed = false
        for goal in goals {
            guard let path = goal.photoURL,
                  let data = try? await client.storage.from(AppConstants.photoBucket).download(path: path) else { continue }
            let thumbnail = await Task.detached { UIImage(data: data).flatMap(ImageProcessor.thumbnail) }.value
            goal.photoData = data
            goal.thumbnailData = thumbnail
            changed = true
        }
        if changed { repository.save() }
        return changed
    }

    // MARK: - Wylogowanie

    /// Czyści lokalne dane po wylogowaniu (żeby nie trafiły na inne konto).
    func resetLocalData() {
        for goal in repository.allGoalsIncludingDeleted() {
            context.delete(goal)
        }
        repository.save()
        for key in UserDefaults.standard.dictionaryRepresentation().keys where key.hasPrefix("lastPull.") {
            UserDefaults.standard.removeObject(forKey: key)
        }
        UserDefaults.standard.removeObject(forKey: "lastSyncDate")
        lastSyncDate = nil
        onRemoteChanges?()
    }
}
