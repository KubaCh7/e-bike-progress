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
                    PhotoPlaceholder()
                }
            }
            .clipShape(.rect(cornerRadius: cornerRadius))
            .contentShape(.rect(cornerRadius: cornerRadius))
            .accessibilityLabel(goal.name)
    }
}

/// Zastępcza grafika, gdy nie ma zdjęcia (lub slot w Assets jest pusty).
struct PhotoPlaceholder: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [.teal.opacity(0.55), .indigo.opacity(0.55)], startPoint: .topLeading, endPoint: .bottomTrailing)
            Image(systemName: "bicycle")
                .font(.system(size: 72, weight: .semibold))
                .foregroundStyle(.white.opacity(0.9))
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.yellow)
                        .offset(x: 10, y: -14)
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
