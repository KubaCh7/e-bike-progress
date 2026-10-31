import SwiftUI

/// Ekran logowania: e-mail + hasło albo praca bez konta.
struct AuthView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var isSignUp = false

    var body: some View {
        @Bindable var auth = auth
        ZStack {
            GlassBackground()

            ScrollView {
                VStack(spacing: 24) {
                    LanguagePicker()
                    header

                    Picker(L10n.tr("auth.mode"), selection: $isSignUp.animation(.smooth)) {
                        Text(L10n.tr("auth.signIn")).tag(false)
                        Text(L10n.tr("auth.signUp")).tag(true)
                    }
                    .pickerStyle(.segmented)

                    Group {
                        VStack(spacing: 14) {
                            if isSignUp {
                                TextField(L10n.tr("profile.name"), text: $auth.displayName)
                                    .textContentType(.givenName)
                                    .padding(16)
                                    .card(radius: 12)
                                    .transition(.move(edge: .top).combined(with: .opacity))
                            }
                            TextField(L10n.tr("auth.email"), text: $auth.email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .padding(16)
                                .card(radius: 12)

                            SecureField(L10n.tr("auth.password"), text: $auth.password)
                                .textContentType(isSignUp ? .newPassword : .password)
                                .padding(16)
                                .card(radius: 12)
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
                    .buttonStyle(.primaryFlat)
                    .controlSize(.large)
                    .disabled(!auth.canSubmit || (isSignUp && auth.displayName.trimmingCharacters(in: .whitespaces).isEmpty))

                    HStack {
                        Rectangle().frame(height: 0.5).opacity(0.3)
                        Text(L10n.tr("auth.or")).font(.caption).foregroundStyle(.secondary)
                        Rectangle().frame(height: 0.5).opacity(0.3)
                    }

                    Button(L10n.tr("auth.continueOffline")) {
                        auth.continueOffline()
                    }
                    .buttonStyle(.secondaryFlat)

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
            Image("MotoIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 66)
                .frame(width: 96, height: 96)
                .circleBackground()
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
