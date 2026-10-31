import SwiftUI

/// Ekran główny: zdjęcie celu, uzbierane, pozostało, procent i pasek postępu.
struct HomeView: View {
    @Environment(GoalsViewModel.self) private var viewModel
    @State private var showDepositForm = false
    @State private var showGoalsManager = false
    @State private var showNewGoal = false
    @State private var editingDeposit: Deposit?

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground(photo: viewModel.currentGoal?.uiImage)

                if let goal = viewModel.currentGoal {
                    content(for: goal)
                } else {
                    ContentUnavailableView(L10n.tr("home.noGoals"), systemImage: "bicycle")
                }
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    GoalSwitcherMenu(onManage: { showGoalsManager = true }, onAdd: { showNewGoal = true })
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showDepositForm) {
                if let goal = viewModel.currentGoal {
                    DepositFormView(goal: goal)
                }
            }
            .sheet(item: $editingDeposit) { deposit in
                if let goal = viewModel.currentGoal {
                    DepositFormView(goal: goal, deposit: deposit)
                }
            }
        }
    }

    @ViewBuilder
    private func content(for goal: Goal) -> some View {
        let stats = goal.stats
        ScrollView {
            VStack(spacing: 18) {
                hero(goal: goal, stats: stats)

                GlassEffectContainer(spacing: 12) {
                    HStack(spacing: 12) {
                        StatChip(title: L10n.tr("home.saved"), value: Money.format(stats.total), systemImage: "banknote")
                        StatChip(title: L10n.tr("home.remaining"), value: Money.format(stats.remaining), systemImage: "flag.checkered")
                    }
                }

                recentDeposits(goal: goal)
            }
            .padding(.horizontal)
            .padding(.bottom, 110)
            .animation(.smooth, value: goal.id)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .bottom) {
            QuickAddBar(
                onQuickAmount: { amount in
                    withAnimation(.smooth) { viewModel.addDeposit(amount: amount) }
                },
                onCustom: { showDepositForm = true }
            )
            .padding(.bottom, 8)
        }
        .overlay(alignment: .top) { ToastView(message: Binding(get: { viewModel.toast }, set: { viewModel.toast = $0 })) }
    }

    private func hero(goal: Goal, stats: SavingsStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            GoalPhotoView(goal: goal, cornerRadius: 26)
                .frame(height: 220)
                .overlay(alignment: .topLeading) {
                    if goal.isDefault {
                        Label(L10n.tr("home.mainGoal"), systemImage: "star.fill")
                            .font(.caption.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .glassEffect(.regular, in: .capsule)
                            .padding(12)
                    }
                }

            VStack(alignment: .leading, spacing: 6) {
                Text(goal.name)
                    .font(.title2.bold())
                Text(L10n.tr("home.target", Money.format(goal.targetAmount)))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(alignment: .firstTextBaseline) {
                Text(Money.percent(stats.progress))
                    .font(.system(size: 52, weight: .bold, design: .rounded).monospacedDigit())
                    .contentTransition(.numericText(value: stats.progress))
                Spacer()
                if stats.isAchieved {
                    Text(L10n.tr("home.achieved"))
                        .font(.headline)
                        .foregroundStyle(.green)
                }
            }

            GlassProgressBar(progress: stats.progress)
        }
        .padding(18)
        .glassEffect(.regular, in: .rect(cornerRadius: 34))
    }

    private func recentDeposits(goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.tr("home.recent"))
                .font(.headline)
            let recent = Array(goal.sortedDeposits.prefix(4))
            if recent.isEmpty {
                Text(L10n.tr("home.noDeposits"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(recent) { deposit in
                    Button { editingDeposit = deposit } label: {
                        DepositRow(deposit: deposit)
                    }
                    .buttonStyle(.plain)
                    if deposit.id != recent.last?.id { Divider() }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .glassEffect(.regular, in: .rect(cornerRadius: 28))
    }
}

/// Wiersz z wpłatą (kwota, data, notatka).
struct DepositRow: View {
    let deposit: Deposit

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.down.circle.fill")
                .font(.title2)
                .foregroundStyle(.teal)
            VStack(alignment: .leading, spacing: 2) {
                Text(Money.format(deposit.amount))
                    .font(.body.weight(.semibold).monospacedDigit())
                if let note = deposit.note {
                    Text(note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            Spacer()
            Text(deposit.date.formatted(.dateTime.day().month(.abbreviated).year().locale(L10n.locale)))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .contentShape(.rect)
    }
}

/// Znikający komunikat na szkle.
struct ToastView: View {
    @Binding var message: String?

    var body: some View {
        if let message {
            Label(message, systemImage: "checkmark.circle.fill")
                .font(.subheadline.bold())
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .glassEffect(.regular.tint(.green.opacity(0.35)), in: .capsule)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: message) {
                    try? await Task.sleep(for: .seconds(2))
                    withAnimation(.smooth) { self.message = nil }
                }
        }
    }
}
