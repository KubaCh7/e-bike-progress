import SwiftUI
import AuthenticationServices

/// Ekran logowania: e-mail + hasło lub Sign in with Apple, albo praca bez konta.
struct AuthView: View {
    @Environment(AuthViewModel.self) private var auth
    @Environment(\.colorScheme) private var colorScheme
    @State private var isSignUp = false

    var body: some View {
        @Bindable var auth = auth
        ZStack {
            GlassBackground()

            ScrollView {
                VStack(spacing: 24) {
                    LanguagePicker()
                    header

                    // natywny segmented picker – szklana pastylka przesuwa się między trybami
                    Picker(L10n.tr("auth.mode"), selection: $isSignUp.animation(.smooth)) {
                        Text(L10n.tr("auth.signIn")).tag(false)
                        Text(L10n.tr("auth.signUp")).tag(true)
                    }
                    .pickerStyle(.segmented)

                    GlassEffectContainer(spacing: 14) {
                        VStack(spacing: 14) {
                            if isSignUp {
                                TextField(L10n.tr("profile.name"), text: $auth.displayName)
                                    .textContentType(.givenName)
                                    .padding(16)
                                    .glassEffect(.clear, in: .rect(cornerRadius: 18))
                                    .transition(.move(edge: .top).combined(with: .opacity))
                            }
                            TextField(L10n.tr("auth.email"), text: $auth.email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .padding(16)
                                .glassEffect(.clear, in: .rect(cornerRadius: 18))

                            SecureField(L10n.tr("auth.password"), text: $auth.password)
                                .textContentType(isSignUp ? .newPassword : .password)
                                .padding(16)
                                .glassEffect(.clear, in: .rect(cornerRadius: 18))
                        }
                    }

                    if let error = auth.errorMessage {
                        Text(error).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center)
                    }
                    if let info = auth.infoMessage {
                        Text(info).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }

                    Button {
                        Task {
                            if isSignUp { await auth.signUp() } else { await auth.signIn() }
                        }
                    } label: {
                        Group {
                            if auth.isWorking {
                                ProgressView()
                            } else {
                                Text(isSignUp ? L10n.tr("auth.signUp") : L10n.tr("auth.signIn"))
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glassProminent)
                    .controlSize(.large)
                    .disabled(!auth.canSubmit || (isSignUp && auth.displayName.trimmingCharacters(in: .whitespaces).isEmpty))

                    HStack {
                        Rectangle().frame(height: 0.5).opacity(0.3)
                        Text(L10n.tr("auth.or")).font(.caption).foregroundStyle(.secondary)
                        Rectangle().frame(height: 0.5).opacity(0.3)
                    }

                    SignInWithAppleButton(.signIn) { request in
                        auth.prepareAppleRequest(request)
                    } onCompletion: { result in
                        Task { await auth.handleAppleResult(result) }
                    }
                    .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                    .frame(height: 50)
                    .clipShape(.capsule)

                    Button(L10n.tr("auth.continueOffline")) {
                        auth.continueOffline()
                    }
                    .buttonStyle(.glass)

                    Text(L10n.tr("auth.offlineHint"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(24)
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            Image(systemName: "bicycle")
                .font(.system(size: 44, weight: .semibold))
                .frame(width: 96, height: 96)
                .glassEffect(.clear.tint(.teal.opacity(0.5)), in: .circle)
            Text("e-bike progress")
                .font(.largeTitle.bold())
            Text(L10n.tr("auth.subtitle"))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 4)
    }
}
