import UIKit

/// Kompresja zdjęć przed zapisem (lokalnie i w Supabase Storage).
enum ImageProcessor {
    /// Pełne zdjęcie: maks. 1600 px dłuższy bok, JPEG ~75%.
    static let photoMaxDimension: CGFloat = 1600
    /// Miniatura (Apple Watch): maks. 160 px.
    static let thumbnailMaxDimension: CGFloat = 160

    struct Result: Sendable {
        let photo: Data
        let thumbnail: Data?
    }

    /// Przetwarza surowe dane (JPEG/HEIC/PNG) – wywołuj poza wątkiem głównym.
    static func process(_ data: Data) -> Result? {
        guard let image = UIImage(data: data) else { return nil }
        return process(image)
    }

    static func process(_ image: UIImage) -> Result? {
        guard let photo = jpeg(image, maxDimension: photoMaxDimension, quality: 0.75) else { return nil }
        return Result(photo: photo, thumbnail: thumbnail(image))
    }

    static func thumbnail(_ image: UIImage) -> Data? {
        jpeg(image, maxDimension: thumbnailMaxDimension, quality: 0.6)
    }

    /// Miniatura sugerowanego zdjęcia SR (jeśli asset został dodany).
    static func suggestedThumbnail() -> Data? {
        UIImage(named: AppConstants.suggestedPhotoAsset).flatMap(thumbnail)
    }

    static func jpeg(_ image: UIImage, maxDimension: CGFloat, quality: CGFloat) -> Data? {
        let size = image.size
        guard size.width > 0, size.height > 0 else { return nil }
        let scale = min(1, maxDimension / max(size.width, size.height))
        let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: quality)
    }
}
