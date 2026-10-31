import SwiftUI

/// Selektor celu u góry ekranu (w pasku nawigacji – szklany w iOS 26).
struct GoalSwitcherMenu: View {
    @Environment(GoalsViewModel.self) private var viewModel
    @State private var showManager = false
    @State private var showNewGoal = false

    var body: some View {
        Menu {
            ForEach(viewModel.goals) { goal in
                Button {
                    withAnimation(.smooth) { viewModel.select(goal) }
                } label: {
                    if goal.id == viewModel.currentGoal?.id {
                        Label(goal.name, systemImage: "checkmark")
                    } else if goal.isDefault {
                        Label(goal.name, systemImage: "star.fill")
                    } else {
                        Text(goal.name)
                    }
                }
            }
            Divider()
            Button(L10n.tr("goals.switcher.add"), systemImage: "plus") { showNewGoal = true }
            Button(L10n.tr("goals.switcher.manage"), systemImage: "list.bullet") { showManager = true }
        } label: {
            HStack(spacing: 6) {
                if viewModel.currentGoal?.isDefault == true {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundStyle(.yellow)
                }
                Text(viewModel.currentGoal?.name ?? L10n.tr("home.noGoals"))
                    .font(.headline)
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 6)
        }
        .accessibilityLabel(L10n.tr("goals.switcher.label"))
        .sheet(isPresented: $showManager) { GoalsManagerView() }
        .sheet(isPresented: $showNewGoal) { AddGoalSheet() }
    }
}
