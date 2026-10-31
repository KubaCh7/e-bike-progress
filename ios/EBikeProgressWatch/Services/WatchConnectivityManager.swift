import Foundation
import WatchConnectivity
import WidgetKit
import Observation

/// Komunikacja zegarka z iPhonem (bez bezpośredniego połączenia z backendem).
@Observable
@MainActor
final class WatchConnectivityManager: NSObject {
    /// Ostatni stan głównego celu z iPhone'a.
    private(set) var snapshot: WatchSnapshot
    /// Wpłaty z zegarka czekające na potwierdzenie przez iPhone'a.
    private(set) var pending: [WatchNewDeposit]
    private(set) var isReachable = false

    override init() {
        snapshot = SnapshotStore.load() ?? .placeholder
        pending = SnapshotStore.loadPending()
        super.init()
    }

    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// Poproś iPhone'a o świeży stan.
    func requestSnapshot() {
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else { return }
        WCSession.default.sendMessage([WatchMessageKey.requestSnapshot: true], replyHandler: { reply in
            let box = UncheckedReply(reply)
            Task { @MainActor in self.receive(box.value) }
        }, errorHandler: nil)
    }

    /// Wysyła wpłatę: od razu (gdy iPhone osiągalny) albo w kolejce transferUserInfo.
    func send(_ deposit: WatchNewDeposit) {
        pending.append(deposit)
        SnapshotStore.savePending(pending)
        reloadComplications()

        guard let data = SnapshotStore.encode(deposit) else { return }
        let payload: [String: Any] = [WatchMessageKey.newDeposit: data]
        let session = WCSession.default
        if session.activationState == .activated && session.isReachable {
            session.sendMessage(payload, replyHandler: { reply in
                let box = UncheckedReply(reply)
                Task { @MainActor in self.receive(box.value) }
            }, errorHandler: { _ in
                // iPhone nieosiągalny – kolejka gwarantuje dostarczenie później
                session.transferUserInfo(payload)
            })
        } else {
            session.transferUserInfo(payload)
        }
    }

    fileprivate func receive(_ message: [String: Any]) {
        guard let snapshot = SnapshotStore.decode(WatchSnapshot.self, from: message[WatchMessageKey.snapshot]) else { return }
        guard snapshot.updatedAt >= self.snapshot.updatedAt else { return }
        self.snapshot = snapshot
        SnapshotStore.save(snapshot)
        UserDefaults.standard.set(snapshot.language, forKey: L10n.languageKey)

        // usuń z kolejki wpłaty, które iPhone już zapisał
        let confirmed = Set(snapshot.processedWatchIDs).union(snapshot.recent.map(\.id))
        pending.removeAll { confirmed.contains($0.id) }
        SnapshotStore.savePending(pending)
        reloadComplications()
    }

    private func reloadComplications() {
        WidgetCenter.shared.reloadAllTimelines()
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let context = UncheckedReply(session.receivedApplicationContext)
        let reachable = session.isReachable
        Task { @MainActor in
            self.isReachable = reachable
            self.receive(context.value)
            self.requestSnapshot()
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        let reachable = session.isReachable
        Task { @MainActor in
            self.isReachable = reachable
            if reachable { self.requestSnapshot() }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        let box = UncheckedReply(applicationContext)
        Task { @MainActor in self.receive(box.value) }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        let box = UncheckedReply(message)
        Task { @MainActor in self.receive(box.value) }
    }
}

/// Słowniki WC nie są Sendable – opakowanie do przekazania na MainActor.
struct UncheckedReply: @unchecked Sendable {
    let value: [String: Any]
    init(_ value: [String: Any]) { self.value = value }
}
