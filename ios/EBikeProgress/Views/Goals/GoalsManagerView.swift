import SwiftUI

/// Lista celów: przełączanie, ustawianie głównego, edycja i usuwanie.
struct GoalsManagerView: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss
    @State private var editingGoal: Goal?
    @State private var showNewGoal = false
    @State private var goalToDelete: Goal?

    var body: some View {
        NavigationStack {
            List {
                ForEach(goals.goals) { goal in
                    Button {
                        goals.select(goal)
                        dismiss()
                    } label: {
                        GoalListRow(goal: goal, isSelected: goal.id == goals.currentGoal?.id)
                    }
                    .buttonStyle(.plain)
                    .swipeActions(edge: .leading) {
                        if !goal.isDefault {
                            Button(L10n.tr("goals.setDefault"), systemImage: "star.fill") {
                                withAnimation { goals.setDefault(goal) }
                            }
                            .tint(.yellow)
                        }
                    }
                    .swipeActions(edge: .trailing) {
                        Button(L10n.tr("common.delete"), systemImage: "trash", role: .destructive) {
                            goalToDelete = goal
                        }
                        Button(L10n.tr("common.edit"), systemImage: "pencil") {
                            editingGoal = goal
                        }
                        .tint(.gray)
                    }
                    .contextMenu {
                        if !goal.isDefault {
                            Button(L10n.tr("goals.setDefault"), systemImage: "star") { goals.setDefault(goal) }
                        }
                        Button(L10n.tr("common.edit"), systemImage: "pencil") { editingGoal = goal }
                        Button(L10n.tr("common.delete"), systemImage: "trash", role: .destructive) { goalToDelete = goal }
                    }
                }
            }
            .navigationTitle(L10n.tr("goals.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.tr("common.done"), systemImage: "checkmark") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(L10n.tr("goals.switcher.add"), systemImage: "plus") { showNewGoal = true }
                }
            }
            .sheet(item: $editingGoal) { goal in
                GoalEditorView(goal: goal)
            }
            .sheet(isPresented: $showNewGoal) {
                AddGoalSheet()
            }
            .confirmationDialog(
                L10n.tr("goals.confirmDelete", goalToDelete?.name ?? ""),
                isPresented: Binding(get: { goalToDelete != nil }, set: { if !$0 { goalToDelete = nil } }),
                titleVisibility: .visible
            ) {
                Button(L10n.tr("goals.delete"), role: .destructive) {
                    if let goal = goalToDelete {
                        withAnimation { goals.deleteGoal(goal) }
                    }
                    goalToDelete = nil
                }
            }
        }
    }
}

/// Wiersz celu z miniaturą i postępem.
struct GoalListRow: View {
    let goal: Goal
    var isSelected = false

    var body: some View {
        let stats = goal.stats
        HStack(spacing: 14) {
            GoalPhotoView(goal: goal, cornerRadius: 14)
                .frame(width: 64, height: 64)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text(goal.name).font(.headline).lineLimit(1)
                    if goal.isDefault {
                        Image(systemName: "star.fill").font(.caption).foregroundStyle(.yellow)
                    }
                }
                Text(L10n.tr("goals.progressLine", Money.format(stats.total), Money.format(goal.targetAmount)))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                ProgressView(value: stats.progress)
                    .tint(.primary)
            }
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.secondary)
                    .font(.title3)
            }
        }
        .padding(.vertical, 4)
        .contentShape(.rect)
    }
}
