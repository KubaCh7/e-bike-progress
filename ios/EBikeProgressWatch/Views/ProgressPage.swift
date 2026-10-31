import SwiftUI

/// Pierścień postępu głównego celu + kwoty.
struct ProgressPage: View {
    @Environment(WatchViewModel.self) private var model

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                ProgressRing(progress: model.progress, thumbnail: model.snapshot.thumbnail)
                    .frame(width: 120, height: 120)

                Text(model.snapshot.goalName)
                    .font(.headline)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                VStack(spacing: 4) {
                    amountRow(L10n.tr("home.saved"), Money.formatShort(model.saved), color: .teal)
                    amountRow(L10n.tr("home.remaining"), Money.formatShort(model.remaining), color: .secondary)
                }
                .padding(10)
                .glassEffect(.regular, in: .rect(cornerRadius: 16))
            }
            .padding(.horizontal, 4)
        }
        .containerBackground(
            LinearGradient(colors: [.teal.opacity(0.45), .indigo.opacity(0.35), .black], startPoint: .top, endPoint: .bottom),
            for: .tabView
        )
        .navigationTitle(Text(verbatim: "e-bike"))
    }

    private func amountRow(_ title: String, _ value: String, color: Color) -> some View {
        HStack {
            Text(title).font(.caption2).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.caption.bold().monospacedDigit()).foregroundStyle(color)
        }
    }
}

/// Pierścień z procentem i miniaturą zdjęcia w środku.
struct ProgressRing: View {
    let progress: Double
    var thumbnail: Data?
    var lineWidth: CGFloat = 12

    var body: some View {
        ZStack {
            if let thumbnail, let image = UIImage(data: thumbnail) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .clipShape(.circle)
                    .opacity(0.35)
                    .padding(lineWidth)
            }
            Circle()
                .stroke(.white.opacity(0.15), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(colors: [.mint, .teal, .indigo, .mint], center: .center),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(duration: 0.8), value: progress)
            Text(Money.percent(progress))
                .font(.system(.title2, design: .rounded).bold().monospacedDigit())
                .contentTransition(.numericText(value: progress))
        }
    }
}
