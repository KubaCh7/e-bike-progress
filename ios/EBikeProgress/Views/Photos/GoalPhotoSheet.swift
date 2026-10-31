import SwiftUI

/// Arkusz zmiany zdjęcia istniejącego celu.
struct GoalPhotoSheet: View {
    let goal: Goal
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    GoalPhotoView(goal: goal, cornerRadius: 28)
                        .frame(height: 240)

                    if goal.isSeedGoal {
                        Text(L10n.tr("photo.suggestionHint"))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    PhotoSourceButtons(
                        showSuggested: goal.isSeedGoal && !goal.isSuggestedPhoto,
                        canRemove: goal.photoData != nil || goal.photoURL != nil,
                        onPicked: { result in
                            withAnimation(.smooth) { goals.setPhoto(goal, data: result.photo, thumbnail: result.thumbnail) }
                        },
                        onSuggested: {
                            withAnimation(.smooth) { goals.useSuggestedPhoto(goal) }
                        },
                        onRemove: {
                            withAnimation(.smooth) { goals.removePhoto(goal) }
                        }
                    )
                }
                .padding()
            }
            .navigationTitle(L10n.tr("photo.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.tr("common.done"), systemImage: "checkmark") { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
    }
}
