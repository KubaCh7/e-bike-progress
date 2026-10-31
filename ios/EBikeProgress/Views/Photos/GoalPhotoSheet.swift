import SwiftUI

/// Arkusz zdjęcia celu: wybór zdjęcia (galeria, aparat, link) i przesuwanie kadru
/// palcem w górę, dół, lewo i prawo. Kadr synchronizuje się ze stroną.
struct GoalPhotoSheet: View {
    let goal: Goal
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss

    /// Kadr w trakcie przeciągania („x% y%”).
    @State private var draft: String?
    @State private var dragStart: CGPoint?

    private var hasOwnImage: Bool { goal.uiImage != nil }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GeometryReader { proxy in
                        GoalPhotoView(goal: goal, cornerRadius: 12, position: draft, emptyHint: L10n.tr("photo.add"))
                            .gesture(dragGesture(size: proxy.size), including: hasOwnImage ? .all : .none)
                            .overlay(alignment: .bottomLeading) {
                                if hasOwnImage {
                                    Text(L10n.tr("photo.cropHint"))
                                        .font(.caption)
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(.black.opacity(0.6), in: .rect(cornerRadius: 4))
                                        .padding(8)
                                }
                            }
                    }
                    .aspectRatio(4 / 3, contentMode: .fit)

                    if hasOwnImage {
                        HStack {
                            Text(L10n.tr("photo.cropText"))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Spacer(minLength: 8)
                            if (draft ?? goal.photoPosition) != nil {
                                Button(L10n.tr("photo.center")) {
                                    draft = nil
                                    goals.setPhotoPosition(goal, nil)
                                }
                                .buttonStyle(.secondaryFlat)
                            }
                        }
                    }

                    if goal.isSeedGoal && !goal.isSuggestedPhoto {
                        Text(L10n.tr("photo.suggestionHint"))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    PhotoSourceButtons(
                        showSuggested: goal.isSeedGoal && !goal.isSuggestedPhoto,
                        canRemove: goal.photoData != nil || goal.photoURL != nil,
                        onPicked: { result in
                            draft = nil
                            withAnimation(.smooth) { goals.setPhoto(goal, data: result.photo, thumbnail: result.thumbnail) }
                        },
                        onSuggested: {
                            draft = nil
                            withAnimation(.smooth) { goals.useSuggestedPhoto(goal) }
                        },
                        onRemove: {
                            draft = nil
                            withAnimation(.smooth) { goals.removePhoto(goal) }
                        }
                    )
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(L10n.tr("photo.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.tr("common.done")) { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
    }

    /// Przeciąganie zdjęcia: ruch w prawo pokazuje jego lewą część (mniejsze x), jak na stronie.
    private func dragGesture(size: CGSize) -> some Gesture {
        DragGesture(minimumDistance: 2)
            .onChanged { value in
                let start = dragStart ?? PositionedImage.parse(draft ?? goal.photoPosition)
                if dragStart == nil { dragStart = start }
                let x = start.x - value.translation.width / max(size.width, 1) * 100
                let y = start.y - value.translation.height / max(size.height, 1) * 100
                draft = "\(Int(min(max(x, 0), 100).rounded()))% \(Int(min(max(y, 0), 100).rounded()))%"
            }
            .onEnded { _ in
                dragStart = nil
                if let draft { goals.setPhotoPosition(goal, draft) }
            }
    }
}
