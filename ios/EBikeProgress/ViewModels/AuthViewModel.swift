import Foundation
import Observation
import AuthenticationServices
import CryptoKit
import Supabase

/// Logowanie: e-mail + hasło lub Sign in with Apple (Supabase Auth).
@Observable
@MainActor
final class AuthViewModel {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(userID: UUID, email: String?)
    }

    private(set) var state: State = .loading
    var email = ""
    var password = ""
    var isWorking = false
    var errorMessage: String?
    var infoMessage: String?

    /// Użytkownik wybrał pracę bez konta (tylko lokalnie).
    var offlineMode: Bool {
        didSet { UserDefaults.standard.set(offlineMode, forKey: "offlineMode") }
    }

    /// Wywoływane po zalogowaniu / wylogowaniu.
    @ObservationIgnored var onSignedIn: (() -> Void)?
    @ObservationIgnored var onSignedOut: (() -> Void)?

    private let client: SupabaseClient?
    @ObservationIgnored private var currentNonce: String?
    @ObservationIgnored private var listenTask: Task<Void, Never>?

    init(client: SupabaseClient? = SupabaseConfig.client) {
        self.client = client
        offlineMode = UserDefaults.standard.bool(forKey: "offlineMode")
        if client == nil { state = .signedOut }
    }

    var isConfigured: Bool { client != nil }

    var isSignedIn: Bool {
        if case .signedIn = state { return true }
        return false
    }

    var userEmail: String? {
        if case .signedIn(_, let email) = state { return email }
        return nil
    }

    /// Czy pokazać ekran logowania zamiast aplikacji.
    var needsAuthScreen: Bool {
        isConfigured && !offlineMode && state == .signedOut
    }

    var canSubmit: Bool {
        email.contains("@") && password.count >= 6 && !isWorking
    }

    // MARK: - Nasłuchiwanie sesji

    func start() {
        guard let client, listenTask == nil else { return }
        listenTask = Task { [weak self] in
            for await (_, session) in client.auth.authStateChanges {
                guard let self else { return }
                let wasSignedIn = self.isSignedIn
                if let session {
                    self.state = .signedIn(userID: session.user.id, email: session.user.email)
                    if !wasSignedIn { self.onSignedIn?() }
                } else {
                    self.state = .signedOut
                    if wasSignedIn { self.onSignedOut?() }
                }
            }
        }
    }

    // MARK: - E-mail

    func signIn() async {
        await perform {
            _ = try await $0.auth.signIn(email: self.email.trimmed, password: self.password)
        }
    }

    func signUp() async {
        await perform {
            let response = try await $0.auth.signUp(email: self.email.trimmed, password: self.password)
            if response.session == nil {
                self.infoMessage = L10n.tr("auth.checkEmail")
            }
        }
    }

    // MARK: - Sign in with Apple

    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonce()
        currentNonce = nonce
        request.requestedScopes = [.email]
        request.nonce = Self.sha256(nonce)
    }

    func handleAppleResult(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled {
                errorMessage = error.localizedDescription
            }
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8),
                let nonce = currentNonce
            else {
                errorMessage = L10n.tr("auth.appleFailed")
                return
            }
            await perform {
                _ = try await $0.auth.signInWithIdToken(
                    credentials: OpenIDConnectCredentials(provider: .apple, idToken: idToken, nonce: nonce)
                )
            }
        }
    }

    // MARK: - Wylogowanie / tryb offline

    func signOut() async {
        guard let client else { return }
        try? await client.auth.signOut()
        state = .signedOut
        onSignedOut?()
    }

    func continueOffline() {
        offlineMode = true
    }

    func showSignIn() {
        offlineMode = false
    }

    // MARK: - Pomocnicze

    private func perform(_ action: @escaping (SupabaseClient) async throws -> Void) async {
        guard let client else { return }
        isWorking = true
        errorMessage = nil
        infoMessage = nil
        defer { isWorking = false }
        do {
            try await action(client)
            password = ""
            offlineMode = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private static func randomNonce(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var generator = SystemRandomNumberGenerator()
        return String((0..<length).map { _ in charset.randomElement(using: &generator)! })
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

private extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
