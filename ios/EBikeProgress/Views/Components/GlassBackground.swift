import SwiftUI

/// Tło ekranu: jednolity, spokojny kolor systemowy (bez gradientów i rozmycia).
/// Nazwa została, żeby nie zmieniać wszystkich ekranów; `photo` jest ignorowane.
struct GlassBackground: View {
    var photo: UIImage?

    var body: some View {
        Color(.systemGroupedBackground)
            .ignoresSafeArea()
    }
}

#Preview {
    GlassBackground()
}
