import SwiftUI

/// "Dodaj e-bike": najpierw katalog popularnych modeli lub "Własny", potem formularz.
struct AddGoalSheet: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss
    @State private var preset: CatalogBike?
    @State private var showCustom = false
    /// Liczba celów przed otwarciem formularza – po zapisie zamykamy cały arkusz.
    @State private var countBefore = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                CatalogGridView(
                    disabledIDs: Set(goals.goals.compactMap(\.catalogId)),
                    onToggle: {
                        countBefore = goals.goals.count
                        preset = $0
                    },
                    onCustom: {
                        countBefore = goals.goals.count
                        showCustom = true
                    }
                )
                .padding()
            }
            .navigationTitle(L10n.tr("goals.switcher.add"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.tr("common.cancel"), systemImage: "xmark") { dismiss() }
                }
            }
            .sheet(item: $preset, onDismiss: closeIfSaved) { bike in
                GoalEditorView(goal: nil, preset: bike, isFirstGoal: goals.goals.isEmpty)
            }
            .sheet(isPresented: $showCustom, onDismiss: closeIfSaved) {
                GoalEditorView(goal: nil, isFirstGoal: goals.goals.isEmpty)
            }
        }
    }

    private func closeIfSaved() {
        if goals.goals.count > countBefore { dismiss() }
    }
}
