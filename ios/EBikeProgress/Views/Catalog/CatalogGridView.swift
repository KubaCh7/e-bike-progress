import SwiftUI

/// Katalog popularnych e-bike'ów: wyszukiwarka, kategorie, sortowanie po marce (sekcje A–Z) lub cenie.
struct CatalogGridView: View {
    var selected: Set<String> = []
    var disabledIDs: Set<String> = []
    var onToggle: (CatalogBike) -> Void
    var onCustom: () -> Void

    enum SortOrder: String, CaseIterable, Identifiable {
        case popular, brand, price
        var id: String { rawValue }
        var title: String {
            switch self {
            case .popular: L10n.tr("catalog.sortPopular")
            case .brand: L10n.tr("catalog.sortBrand")
            case .price: L10n.tr("catalog.sortPrice")
            }
        }
    }

    /// Ile modeli trafia do sekcji "Najpopularniejsze".
    private let topCount = 8

    @Environment(CatalogStore.self) private var catalog
    @State private var query = ""
    @State private var category: BikeCategory?
    @State private var sort: SortOrder = .popular

    private let columns = [GridItem(.adaptive(minimum: 158), spacing: 12)]

    private var bikes: [CatalogBike] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return catalog.bikes.filter { bike in
            (category == nil || bike.category == category) && (q.isEmpty || bike.displayName.lowercased().contains(q))
        }
    }

    /// Sekcje: najpopularniejsze na górze, marka A–Z albo jedna lista wg ceny.
    private var groups: [(brand: String?, bikes: [CatalogBike])] {
        switch sort {
        case .popular:
            let popular = bikes.sorted { ($0.rank, $0.price) < ($1.rank, $1.price) }
            let top = Array(popular.prefix(topCount))
            let rest = Array(popular.dropFirst(topCount))
            var result: [(brand: String?, bikes: [CatalogBike])] = [(L10n.tr("catalog.top"), top)]
            if !rest.isEmpty { result.append((L10n.tr("catalog.rest"), rest)) }
            return result
        case .price:
            return [(nil, bikes.sorted { $0.price < $1.price })]
        case .brand:
            let byBrand = Dictionary(grouping: bikes, by: \.brand)
            return byBrand.keys
                .sorted { $0.localizedStandardCompare($1) == .orderedAscending }
                .map { ($0, byBrand[$0, default: []].sorted { $0.rank < $1.rank }) }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // natywne segmented pickery – w iOS 26 ze szklaną, przesuwaną pastylką
            Picker(L10n.tr("catalog.category"), selection: $category) {
                Text(L10n.tr("catalog.all")).tag(BikeCategory?.none)
                ForEach(BikeCategory.allCases) { category in
                    Text(category.title).tag(BikeCategory?.some(category))
                }
            }
            .pickerStyle(.segmented)

            Picker(L10n.tr("catalog.sort"), selection: $sort) {
                ForEach(SortOrder.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)

            Button(action: onCustom) {
                HStack(spacing: 14) {
                    Image(systemName: "plus")
                        .font(.title3.bold())
                        .frame(width: 48, height: 48)
                        .circleBackground()
                    VStack(alignment: .leading, spacing: 2) {
                        Text(L10n.tr("catalog.custom")).font(.headline)
                        Text(L10n.tr("catalog.customHint")).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(12)
                .card(radius: 12)
            }
            .buttonStyle(.plain)

            ForEach(groups, id: \.brand) { group in
                if let brand = group.brand {
                    HStack(spacing: 10) {
                        Circle().fill(group.bikes.first?.tint ?? .accentColor).frame(width: 12, height: 12)
                        Text(brand).font(.title2.weight(.heavy))
                        Text("\(group.bikes.count)").font(.subheadline).foregroundStyle(.secondary)
                    }
                    .padding(.top, 8)
                }
                Group {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(Array(group.bikes.enumerated()), id: \.element.id) { index, bike in
                            BikeCard(
                                bike: bike,
                                place: sort == .popular && group.brand == L10n.tr("catalog.top") ? index + 1 : nil,
                                isSelected: selected.contains(bike.id),
                                isDisabled: disabledIDs.contains(bike.id)
                            )
                                .onTapGesture { if !disabledIDs.contains(bike.id) { onToggle(bike) } }
                        }
                    }
                }
            }
            .animation(.smooth, value: category)
            .animation(.smooth, value: sort)

            Text(L10n.tr("catalog.priceNote"))
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .searchable(text: $query, prompt: L10n.tr("catalog.search"))
    }
}

/// Karta modelu z katalogu – marka wyraźnie, w kolorze marki.
struct BikeCard: View {
    let bike: CatalogBike
    /// Miejsce w rankingu (#1, #2…) – tylko w sekcji "Najpopularniejsze".
    var place: Int?
    var isSelected = false
    var isDisabled = false

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            CatalogBikeImage(bike: bike)
                .aspectRatio(16 / 10, contentMode: .fit)
                .clipShape(.rect(cornerRadius: 18))
                .overlay(alignment: .topLeading) {
                    if let place {
                        Text(verbatim: "#\(place)")
                            .font(.system(.title3, design: .rounded).weight(.black))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(place == 1 ? Color(hex: "#d4ff3a") ?? .yellow : .white, in: .rect(cornerRadius: 8))
                            .padding(8)
                    }
                }
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
            HStack(spacing: 6) {
                Circle().fill(bike.tint).frame(width: 8, height: 8)
                Text(bike.brand.uppercased())
                    .font(.caption.weight(.heavy))
                    .tracking(0.6)
            }
            Text(bike.model).font(.headline).lineLimit(1)
            Text(isDisabled ? L10n.tr("catalog.added") : L10n.tr("catalog.from", Money.formatShort(bike.price)))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(8)
        .card(radius: 12)
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
