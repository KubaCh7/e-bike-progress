import SwiftUI
import PhotosUI

/// Szklane przyciski wyboru zdjęcia: sugerowane (SR), galeria, aparat, usuń.
struct PhotoSourceButtons: View {
    var showSuggested: Bool
    var canRemove: Bool
    var onPicked: (ImageProcessor.Result) -> Void
    var onSuggested: () -> Void
    var onRemove: () -> Void

    @State private var model = PhotoPickerViewModel()
    @State private var showCamera = false
    @State private var showLinkPrompt = false
    @State private var link = ""

    var body: some View {
        VStack(spacing: 10) {
            if showSuggested {
                Button(action: onSuggested) {
                    Label(L10n.tr("photo.useSuggested"), systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .controlSize(.large)
            }

            GlassEffectContainer(spacing: 10) {
                HStack(spacing: 10) {
                    PhotosPicker(selection: $model.pickerItem, matching: .images, photoLibrary: .shared()) {
                        Label(L10n.tr("photo.uploadOwn"), systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                    .controlSize(.large)

                    if CameraPicker.isAvailable {
                        Button { showCamera = true } label: {
                            Label(L10n.tr("photo.camera"), systemImage: "camera")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                        .controlSize(.large)
                    }
                }
            }

            Button {
                link = ""
                showLinkPrompt = true
            } label: {
                Label(L10n.tr("photo.fromLink"), systemImage: "link")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.glass)

            if canRemove {
                Button(L10n.tr("photo.remove"), systemImage: "trash", role: .destructive, action: onRemove)
                    .buttonStyle(.glass)
            }

            if model.isProcessing {
                ProgressView(L10n.tr("photo.processing"))
            }
            if let error = model.errorMessage {
                Text(error).font(.footnote).foregroundStyle(.red)
            }
        }
        .onChange(of: model.pickerItem) { _, item in
            guard item != nil else { return }
            Task {
                if let result = await model.loadPickerItem() { onPicked(result) }
            }
        }
        .alert(L10n.tr("photo.fromLink"), isPresented: $showLinkPrompt) {
            TextField("https://…", text: $link)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            Button(L10n.tr("common.cancel"), role: .cancel) {}
            Button(L10n.tr("common.ok")) {
                guard let url = URL(string: link.trimmingCharacters(in: .whitespaces)), url.scheme == "https" else {
                    model.errorMessage = L10n.tr("photo.error")
                    return
                }
                Task {
                    if let result = await model.load(link: url) { onPicked(result) }
                }
            }
        } message: {
            Text(L10n.tr("photo.linkHint"))
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker { image in
                Task {
                    if let result = await model.process(cameraImage: image) { onPicked(result) }
                }
            }
            .ignoresSafeArea()
        }
    }
}
