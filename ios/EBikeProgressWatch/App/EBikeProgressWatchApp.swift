import SwiftUI

@main
struct EBikeProgressWatchApp: App {
    @State private var connectivity: WatchConnectivityManager
    @State private var model: WatchViewModel

    init() {
        let connectivity = WatchConnectivityManager()
        _connectivity = State(initialValue: connectivity)
        _model = State(initialValue: WatchViewModel(connectivity: connectivity))
    }

    var body: some Scene {
        WindowGroup {
            WatchRootView()
                .environment(model)
                .task { connectivity.start() }
        }
    }
}
