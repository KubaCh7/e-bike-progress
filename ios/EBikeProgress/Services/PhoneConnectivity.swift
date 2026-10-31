import Foundation
import WatchConnectivity
import WidgetKit
import Observation

/// Komunikacja iPhone → Apple Watch. Zegarek nie łączy się z backendem –
/// dostaje stan głównego celu od iPhone'a i odsyła nowe wpłaty.
@Observable
@MainActor
final class PhoneConnectivity: NSObject {
    /// Buduje aktualny stan głównego celu (ustawiane przez AppCoordinator).
    @ObservationIgnored var snapshotProvider: (() -> WatchSnapshot?)?
    /// Zapisuje wpłatę z zegarka; zwraca true, gdy się udało.
    @ObservationIgnored var depositHandler: ((WatchNewDeposit) -> Bool)?

    private(set) var isPaired = false
    private(set) var isWatchAppInstalled = false

    private let processedKey = "processedWatchDepositIDs"

    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// Wysyła aktualny stan na zegarek (applicationContext + wiadomość, jeśli osiągalny).
    func pushSnapshot() {
        guard var snapshot = snapshotProvider?() else { return }
        // widżety iPhone'a (ekran blokady, ekran początkowy, Mac) czytają stan z App Group
        SnapshotStore.save(snapshot)
        WidgetCenter.shared.reloadAllTimelines()
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        snapshot.processedWatchIDs = processedIDs
        guard let data = SnapshotStore.encode(snapshot) else { return }
        let payload: [String: Any] = [WatchMessageKey.snapshot: data]
        do {
            try WCSession.default.updateApplicationContext(payload)
        } catch {
            print("WC updateApplicationContext error: \(error)")
        }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil)
        }
    }

    // MARK: - Obsługa wpłat z zegarka

    private var processedIDs: [UUID] {
        (UserDefaults.standard.stringArray(forKey: processedKey) ?? []).compactMap(UUID.init(uuidString:))
    }

    private func markProcessed(_ id: UUID) {
        var ids = UserDefaults.standard.stringArray(forKey: processedKey) ?? []
        ids.append(id.uuidString)
        UserDefaults.standard.set(Array(ids.suffix(50)), forKey: processedKey)
    }

    fileprivate func handle(_ message: [String: Any]) -> [String: Any] {
        if let deposit = SnapshotStore.decode(WatchNewDeposit.self, from: message[WatchMessageKey.newDeposit]) {
            if !processedIDs.contains(deposit.id), depositHandler?(deposit) == true {
                markProcessed(deposit.id)
            }
        }
        guard var snapshot = snapshotProvider?() else { return [:] }
        snapshot.processedWatchIDs = processedIDs
        guard let data = SnapshotStore.encode(snapshot) else { return [:] }
        return [WatchMessageKey.snapshot: data]
    }
}

// MARK: - WCSessionDelegate

extension PhoneConnectivity: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let paired = session.isPaired
        let installed = session.isWatchAppInstalled
        Task { @MainActor in
            self.isPaired = paired
            self.isWatchAppInstalled = installed
            self.pushSnapshot()
        }
    }

    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}

    nonisolated func sessionDidDeactivate(_ session: WCSession) {
        // po zmianie zegarka trzeba aktywować sesję ponownie
        session.activate()
    }

    nonisolated func sessionWatchStateDidChange(_ session: WCSession) {
        let paired = session.isPaired
        let installed = session.isWatchAppInstalled
        Task { @MainActor in
            self.isPaired = paired
            self.isWatchAppInstalled = installed
            self.pushSnapshot()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        let box = UncheckedBox(message)
        let reply = UncheckedBox(replyHandler)
        Task { @MainActor in
            reply.value(self.handle(box.value))
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        let box = UncheckedBox(message)
        Task { @MainActor in
            _ = self.handle(box.value)
            self.pushSnapshot()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        let box = UncheckedBox(userInfo)
        Task { @MainActor in
            _ = self.handle(box.value)
            self.pushSnapshot()
        }
    }
}

/// Opakowanie wartości przekazywanych między wątkami (słowniki WC nie są Sendable).
struct UncheckedBox<T>: @unchecked Sendable {
    let value: T
    init(_ value: T) { self.value = value }
}
