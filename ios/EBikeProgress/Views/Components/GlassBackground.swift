import SwiftUI

/// Kolorowe, rozmyte tło – szkło (Liquid Glass) ma co załamywać.
struct GlassBackground: View {
    var photo: UIImage?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        MeshGradient(
            width: 3,
            height: 3,
            points: [
                [0, 0], [0.5, 0], [1, 0],
                [0, 0.5], [0.55, 0.45], [1, 0.5],
                [0, 1], [0.5, 1], [1, 1]
            ],
            colors: colorScheme == .dark ? darkColors : lightColors
        )
        .overlay {
            // rozmyte zdjęcie celu jako dodatkowa warstwa koloru
            if let photo {
                Image(uiImage: photo)
                    .resizable()
                    .scaledToFill()
                    .blur(radius: 60)
                    .opacity(colorScheme == .dark ? 0.45 : 0.55)
            }
        }
        .clipped()
        .ignoresSafeArea()
    }

    private var lightColors: [Color] {
        [.mint, .teal, .cyan,
         .green.opacity(0.7), .white, .indigo.opacity(0.6),
         .yellow.opacity(0.6), .orange.opacity(0.6), .purple.opacity(0.6)]
    }

    private var darkColors: [Color] {
        [Color(red: 0.02, green: 0.25, blue: 0.25), .teal.opacity(0.7), .indigo,
         Color(red: 0.05, green: 0.08, blue: 0.2), .black, .purple.opacity(0.7),
         .indigo.opacity(0.8), Color(red: 0.25, green: 0.1, blue: 0.3), .black]
    }
}

#Preview {
    GlassBackground()
}
