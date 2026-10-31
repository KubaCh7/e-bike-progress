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
