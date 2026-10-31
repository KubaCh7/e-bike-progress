import SwiftUI

/// Wybór języka (PL / EN) przed logowaniem – zmiana od razu, bez restartu.
struct LanguagePicker: View {
    @AppStorage(SettingsKey.language) private var language: AppLanguage = .pl

    var body: some View {
        Picker(L10n.tr("settings.language"), selection: $language) {
            Text(verbatim: "🇵🇱 Polski").tag(AppLanguage.pl)
            Text(verbatim: "🇬🇧 English").tag(AppLanguage.en)
        }
        .pickerStyle(.segmented)
        .frame(maxWidth: 280)
    }
}

#Preview {
    LanguagePicker().padding()
}
