import Foundation
import Supabase

/// Klient Supabase tworzony z Info.plist (wartości z Secrets.xcconfig – poza repo).
enum SupabaseConfig {
    static let client: SupabaseClient? = {
        guard
            let host = Bundle.main.object(forInfoDictionaryKey: "SupabaseHost") as? String,
            let key = Bundle.main.object(forInfoDictionaryKey: "SupabaseAnonKey") as? String,
            !host.isEmpty, !key.isEmpty, !host.contains("$("),
            let url = URL(string: "https://\(host)")
        else {
            print("Supabase nie jest skonfigurowany – aplikacja działa tylko lokalnie.")
            return nil
        }
        return SupabaseClient(supabaseURL: url, supabaseKey: key)
    }()

    static var isConfigured: Bool { client != nil }
}
