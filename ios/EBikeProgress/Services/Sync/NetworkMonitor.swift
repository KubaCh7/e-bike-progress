import Foundation
import Network
import Observation

/// Obserwuje dostęp do sieci – po jego odzyskaniu dosyłamy zmiany.
@Observable
@MainActor
final class NetworkMonitor {
    private(set) var isOnline = true
    @ObservationIgnored var onReconnect: (() -> Void)?

    private let monitor = NWPathMonitor()

    func start() {
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor in
                guard let self else { return }
                let wasOffline = !self.isOnline
                self.isOnline = online
                if online && wasOffline { self.onReconnect?() }
            }
        }
        monitor.start(queue: DispatchQueue(label: "NetworkMonitor"))
    }
}
