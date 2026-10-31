import SwiftUI

// Minimalistyczny styl jak na stronie: płaskie powierzchnie, cienka ramka,
// czarny przycisk główny, szary drugorzędny. Bez szkła, gradientów i poświat.

extension View {
    /// Karta: biała (w ciemnym motywie grafitowa) powierzchnia z cienką ramką.
    func card(radius: CGFloat = 12) -> some View {
        background(Color(.secondarySystemGroupedBackground), in: .rect(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Color(.separator).opacity(0.5), lineWidth: 0.5))
    }

    /// Małe tło w kształcie kapsuły (np. przycisk kwoty).
    func chipBackground() -> some View {
        background(Color(.tertiarySystemFill), in: .capsule)
    }

    /// Okrągłe tło ikony.
    func circleBackground() -> some View {
        background(Color(.tertiarySystemFill), in: .circle)
    }
}

/// Główny przycisk: czarny (w ciemnym motywie biały), jeden na ekranie.
struct PrimaryFlatButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(Color(.systemBackground))
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(Color.primary, in: .rect(cornerRadius: 10))
            .opacity(isEnabled ? (configuration.isPressed ? 0.8 : 1) : 0.35)
    }
}

/// Drugorzędny przycisk: szare tło, tekst w kolorze tekstu.
struct SecondaryFlatButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.medium))
            .foregroundStyle(.primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(.tertiarySystemFill), in: .rect(cornerRadius: 10))
            .opacity(isEnabled ? (configuration.isPressed ? 0.7 : 1) : 0.35)
    }
}

extension ButtonStyle where Self == PrimaryFlatButtonStyle {
    static var primaryFlat: PrimaryFlatButtonStyle { PrimaryFlatButtonStyle() }
}

extension ButtonStyle where Self == SecondaryFlatButtonStyle {
    static var secondaryFlat: SecondaryFlatButtonStyle { SecondaryFlatButtonStyle() }
}

extension CatalogBike {
    /// Kolor marki przyciemniony tak, by był czytelny na jasnym tle (dane, nie ozdoba).
    var dataTint: Color {
        // jasne barwy (np. limonka, turkus) przyciemniamy, żeby miały kontrast min. 3:1 na białym
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        guard UIColor(tint).getRed(&r, green: &g, blue: &b, alpha: &a) else { return tint }
        let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        guard luminance > 0.45 else { return tint }
        let k: CGFloat = 0.45 / luminance
        return Color(red: Double(r * k), green: Double(g * k), blue: Double(b * k))
    }
}
