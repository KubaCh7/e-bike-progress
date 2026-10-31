import SwiftUI
import PhotosUI
import Observation

/// Wczytywanie zdjęcia z galerii / aparatu i kompresja w tle.
@Observable
@MainActor
final class PhotoPickerViewModel {
    var pickerItem: PhotosPickerItem?
    var isProcessing = false
    var errorMessage: String?

    /// Wczytuje zdjęcie z PhotosPicker i zwraca skompresowane dane.
    func loadPickerItem() async -> ImageProcessor.Result? {
        guard let item = pickerItem else { return nil }
        isProcessing = true
        defer {
            isProcessing = false
            pickerItem = nil
        }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { throw CocoaError(.fileReadCorruptFile) }
            let result = await Task.detached(priority: .userInitiated) { ImageProcessor.process(data) }.value
            if result == nil { errorMessage = L10n.tr("photo.error") }
            return result
        } catch {
            errorMessage = L10n.tr("photo.error")
            return nil
        }
    }

    /// Kompresuje zdjęcie z aparatu.
    func process(cameraImage: UIImage) async -> ImageProcessor.Result? {
        isProcessing = true
        defer { isProcessing = false }
        let result = await Task.detached(priority: .userInitiated) { ImageProcessor.process(cameraImage) }.value
        if result == nil { errorMessage = L10n.tr("photo.error") }
        return result
    }
}
