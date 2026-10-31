import WidgetKit
import SwiftUI

/// Widżety iPhone'a: ekran blokady (jak widżet „Baterie”), ekran początkowy,
/// a przez „Widżety iPhone'a” także biurko i Centrum powiadomień na Macu.
@main
struct EBikeProgressPhoneWidgets: WidgetBundle {
    var body: some Widget {
        SavingsWidget()
    }
}
