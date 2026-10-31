import SwiftUI

/// Historia wpłat wybranego celu – od najnowszej, z edycją i usuwaniem.
struct HistoryView: View {
    @Environment(GoalsViewModel.self) private var viewModel
    @State private var editingDeposit: Deposit?
    @State private var showNewDeposit = false

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground(photo: viewModel.currentGoal?.uiImage)

                if let goal = viewModel.currentGoal {
                    list(for: goal)
                }
            }
            .navigationTitle(L10n.tr("history.title"))
            .toolbar {
                ToolbarItem(placement: .principal) {
                    GoalSwitcherMenu()
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(L10n.tr("home.addDeposit"), systemImage: "plus") { showNewDeposit = true }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $editingDeposit) { deposit in
                if let goal = viewModel.currentGoal {
                    DepositFormView(goal: goal, deposit: deposit)
                }
            }
            .sheet(isPresented: $showNewDeposit) {
                if let goal = viewModel.currentGoal {
                    DepositFormView(goal: goal)
                }
            }
        }
    }

    @ViewBuilder
    private func list(for goal: Goal) -> some View {
        let deposits = goal.sortedDeposits
        if deposits.isEmpty {
            ContentUnavailableView {
                Label(L10n.tr("history.empty"), systemImage: "tray")
            } description: {
                Text(L10n.tr("history.emptyDesc"))
            } actions: {
                Button(L10n.tr("home.addDeposit"), systemImage: "plus") { showNewDeposit = true }
                    .buttonStyle(.primaryFlat)
            }
        } else {
            List {
                Section {
                    summary(goal: goal, deposits: deposits)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                }

                ForEach(groupedByMonth(deposits), id: \.month) { group in
                    Section {
                        ForEach(group.deposits) { deposit in
                            Button { editingDeposit = deposit } label: {
                                DepositRow(deposit: deposit)
                            }
                            .buttonStyle(.plain)
                            .swipeActions(edge: .trailing) {
                                Button(L10n.tr("common.delete"), systemImage: "trash", role: .destructive) {
                                    withAnimation { viewModel.deleteDeposit(deposit) }
                                }
                                Button(L10n.tr("common.edit"), systemImage: "pencil") {
                                    editingDeposit = deposit
                                }
                                .tint(.gray)
                            }
                            .contextMenu {
                                Button(L10n.tr("common.edit"), systemImage: "pencil") { editingDeposit = deposit }
                                Button(L10n.tr("common.delete"), systemImage: "trash", role: .destructive) {
                                    withAnimation { viewModel.deleteDeposit(deposit) }
                                }
                            }
                        }
                        .listRowBackground(Rectangle().fill(.regularMaterial.opacity(0.7)))
                    } header: {
                        HStack {
                            Text(group.month.formatted(.dateTime.month(.wide).year().locale(L10n.locale)).capitalized)
                            Spacer()
                            Text(Money.format(group.total))
                                .monospacedDigit()
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .animation(.smooth, value: deposits.map(\.id))
        }
    }

    private func summary(goal: Goal, deposits: [Deposit]) -> some View {
        let stats = goal.stats
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(L10n.tr("history.count", deposits.count))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(Money.format(stats.total))
                    .font(.title2.bold().monospacedDigit())
            }
            Spacer()
            Text(Money.percent(stats.progress))
                .font(.title3.bold().monospacedDigit())
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .chipBackground()
        }
        .padding(18)
        .card(radius: 12)
        .padding(.vertical, 4)
    }

    private struct MonthGroup {
        let month: Date
        let deposits: [Deposit]
        var total: Decimal { deposits.reduce(0) { $0 + $1.amount } }
    }

    private func groupedByMonth(_ deposits: [Deposit]) -> [MonthGroup] {
        let calendar = Calendar.current
        let groups = Dictionary(grouping: deposits) {
            calendar.dateInterval(of: .month, for: $0.date)?.start ?? $0.date
        }
        return groups.keys.sorted(by: >).map { MonthGroup(month: $0, deposits: groups[$0] ?? []) }
    }
}

#Preview {
    let container = PersistenceController.preview
    let vm = GoalsViewModel(repository: GoalRepository(context: container.mainContext))
    return HistoryView().environment(vm)
}
