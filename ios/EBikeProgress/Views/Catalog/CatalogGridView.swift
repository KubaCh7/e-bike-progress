import SwiftUI

/// Siatka popularnych e-bike'ów z wyszukiwarką i filtrem kategorii + karta "Własny".
struct CatalogGridView: View {
    var selected: Set<String> = []
    var disabledIDs: Set<String> = []
    var onToggle: (CatalogBike) -> Void
    var onCustom: () -> Void

    @Environment(CatalogStore.self) private var catalog
    @State private var query = ""
    @State private var category: BikeCategory?

    private let columns = [GridItem(.adaptive(minimum: 158), spacing: 12)]

    private var bikes: [CatalogBike] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return catalog.bikes.filter { bike in
            (category == nil || bike.category == category) && (q.isEmpty || bike.displayName.lowercased().contains(q))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // natywny segmented picker – w iOS 26 ma szklaną, przesuwaną pastylkę
            Picker(L10n.tr("catalog.category"), selection: $category) {
                Text(L10n.tr("catalog.all")).tag(BikeCategory?.none)
                ForEach(BikeCategory.allCases) { category in
                    Text(category.title).tag(BikeCategory?.some(category))
                }
            }
            .pickerStyle(.segmented)

            GlassEffectContainer(spacing: 12) {
                LazyVGrid(columns: columns, spacing: 12) {
                    Button(action: onCustom) {
                        VStack(spacing: 8) {
                            Image(systemName: "plus")
                                .font(.title2.bold())
                                .frame(width: 54, height: 54)
                                .glassEffect(.regular.tint(.accentColor.opacity(0.3)), in: .circle)
                            Text(L10n.tr("catalog.custom")).font(.headline)
                            Text(L10n.tr("catalog.customHint"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, minHeight: 190)
                        .padding(10)
                        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 24))
                    }
                    .buttonStyle(.plain)

                    ForEach(bikes) { bike in
                        BikeCard(bike: bike, isSelected: selected.contains(bike.id), isDisabled: disabledIDs.contains(bike.id))
                            .onTapGesture { if !disabledIDs.contains(bike.id) { onToggle(bike) } }
                    }
                }
            }
            .animation(.smooth, value: category)

            Text(L10n.tr("catalog.priceNote"))
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .searchable(text: $query, prompt: L10n.tr("catalog.search"))
    }
}

/// Karta modelu z katalogu.
struct BikeCard: View {
    let bike: CatalogBike
    var isSelected = false
    var isDisabled = false

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            BikeArtView(category: bike.category, tint: bike.tint)
                .aspectRatio(16 / 10, contentMode: .fit)
                .clipShape(.rect(cornerRadius: 18))
                .overlay(alignment: .topTrailing) {
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .symbolRenderingMode(.palette)
                            .foregroundStyle(.white, Color.accentColor)
                            .padding(8)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                .padding(.bottom, 6)
            Text(bike.brand).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(bike.model).font(.headline).lineLimit(1)
            Text(isDisabled ? L10n.tr("catalog.added") : L10n.tr("catalog.from", Money.formatShort(bike.price)))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(8)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 24))
        .overlay {
            RoundedRectangle(cornerRadius: 24)
                .strokeBorder(Color.accentColor, lineWidth: isSelected ? 2.5 : 0)
        }
        .opacity(isDisabled ? 0.45 : 1)
        .animation(.bouncy, value: isSelected)
        .contentShape(.rect(cornerRadius: 24))
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }
}
