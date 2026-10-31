import SwiftUI

/// Zdjęcie celu: własne (z galerii/aparatu), sugerowane z Assets lub grafika zastępcza.
struct GoalPhotoView: View {
    let goal: Goal
    var cornerRadius: CGFloat = 28

    var body: some View {
        // Color.clear przyjmuje dokładnie zaproponowany rozmiar – zdjęcie nie rozpycha układu
        Color.clear
            .overlay {
                if let image = goal.uiImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    PhotoPlaceholder(bike: goal.catalogBike)
                }
            }
            .clipShape(.rect(cornerRadius: cornerRadius))
            .contentShape(.rect(cornerRadius: cornerRadius))
            .accessibilityLabel(goal.name)
    }
}

/// Zastępcza grafika, gdy nie ma zdjęcia: gradient w kolorze marki + sylwetka pojazdu.
struct PhotoPlaceholder: View {
    var bike: CatalogBike?

    var body: some View {
        if let bike {
            CatalogBikeImage(bike: bike)
        } else {
            BikeArtView(category: .emtb, tint: .teal)
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
                            BikeArtView(category: bike.category, tint: bike.tint)
                        }
                    }
                } else {
                    BikeArtView(category: bike.category, tint: bike.tint)
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

/// Ilustracja e-bike'a (bez pobierania zdjęć z internetu).
struct BikeArtView: View {
    let category: BikeCategory
    let tint: Color

    private var symbol: String {
        switch category {
        case .moto:
            // "motorcycle" jest w nowszych SF Symbols – w razie braku zwykły rower
            UIImage(systemName: "motorcycle") != nil ? "motorcycle" : "bicycle"
        case .emtb, .city:
            "bicycle"
        }
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [tint, tint.opacity(0.55)], startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(colors: [.white.opacity(0.4), .clear], center: .topLeading, startRadius: 0, endRadius: 260)
            Image(systemName: symbol)
                .resizable()
                .scaledToFit()
                .fontWeight(.semibold)
                .foregroundStyle(.white)
                .padding(28)
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "bolt.fill")
                        .font(.title2.bold())
                        .foregroundStyle(.yellow)
                        .padding(18)
                }
        }
    }
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
