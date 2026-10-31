import SwiftUI

/// Zdjęcie celu: własne (z galerii/aparatu), sugerowane z Assets, z katalogu albo ikona.
/// Kadr (photoPosition, „x% y%”) działa jak CSS object-position na stronie.
struct GoalPhotoView: View {
    let goal: Goal
    var cornerRadius: CGFloat = 12
    /// Podgląd kadru podczas przeciągania (nadpisuje zapisany).
    var position: String? = nil
    /// Tekst pod ikoną, gdy nie ma zdjęcia (np. „Dodaj zdjęcie”).
    var emptyHint: String? = nil

    var body: some View {
        // Color.clear przyjmuje dokładnie zaproponowany rozmiar – zdjęcie nie rozpycha układu
        Color.clear
            .overlay {
                if let image = goal.uiImage {
                    PositionedImage(image: image, position: position ?? goal.photoPosition)
                } else if let bike = goal.catalogBike, bike.image != nil {
                    CatalogBikeImage(bike: bike)
                } else {
                    PhotoPlaceholder(hint: emptyHint)
                }
            }
            .clipShape(.rect(cornerRadius: cornerRadius))
            .contentShape(.rect(cornerRadius: cornerRadius))
            .accessibilityLabel(goal.name)
    }
}

/// Zdjęcie wypełniające ramkę, przesunięte według „x% y%” (0% = lewa/górna krawędź).
struct PositionedImage: View {
    let image: UIImage
    var position: String?

    static func parse(_ position: String?) -> CGPoint {
        let parts = (position ?? "").split(separator: " ").compactMap { Double($0.replacingOccurrences(of: "%", with: "")) }
        guard parts.count == 2 else { return CGPoint(x: 50, y: 50) }
        return CGPoint(x: min(max(parts[0], 0), 100), y: min(max(parts[1], 0), 100))
    }

    var body: some View {
        GeometryReader { proxy in
            let frame = proxy.size
            let size = image.size
            let scale = max(frame.width / max(size.width, 1), frame.height / max(size.height, 1))
            let width = size.width * scale
            let height = size.height * scale
            let point = Self.parse(position)
            Image(uiImage: image)
                .resizable()
                .frame(width: width, height: height)
                .offset(x: -(width - frame.width) * point.x / 100, y: -(height - frame.height) * point.y / 100)
        }
    }
}

/// Gdy nie ma zdjęcia: spokojna ikona e-bike'a na szarym tle (jak na stronie).
struct PhotoPlaceholder: View {
    var hint: String? = nil

    var body: some View {
        ZStack {
            Color(.tertiarySystemFill)
            VStack(spacing: 8) {
                Image(systemName: "bicycle")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(.primary)
                    .frame(width: 56, height: 56)
                    .background(Color(.secondarySystemGroupedBackground), in: .circle)
                if let hint {
                    Text(hint)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

/// Zdjęcie modelu z katalogu (wolna licencja) – ładowane z sieci, z ilustracją jako zapasem.
struct CatalogBikeImage: View {
    let bike: CatalogBike
    var showCredit = false

    var body: some View {
        Color.clear
            .overlay {
                if let url = bike.image {
                    AsyncImage(url: url, transaction: Transaction(animation: .smooth)) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        default:
                            PhotoPlaceholder()
                        }
                    }
                } else {
                    PhotoPlaceholder()
                }
            }
            .overlay(alignment: .bottomLeading) {
                if showCredit, bike.image != nil, let credit = bike.imageCredit {
                    Text(credit)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.black.opacity(0.35), in: .capsule)
                        .padding(8)
                }
            }
            .clipped()
    }
}

/// Dawna ilustracja – teraz ta sama spokojna ikona co wszędzie.
struct BikeArtView: View {
    let category: BikeCategory
    let tint: Color

    var body: some View { PhotoPlaceholder() }
}

extension Goal {
    /// Obraz do wyświetlenia (nil = brak zdjęcia).
    var uiImage: UIImage? {
        if let photoData, let image = UIImage(data: photoData) {
            return image
        }
        if isSuggestedPhoto {
            return UIImage(named: AppConstants.suggestedPhotoAsset)
        }
        return nil
    }
}
