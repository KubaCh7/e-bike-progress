import SwiftUI

/// Ekran główny: zdjęcie celu, uzbierane, pozostało, procent i pasek postępu.
struct HomeView: View {
    @Environment(GoalsViewModel.self) private var viewModel
    @Environment(ProfileStore.self) private var profile
    @State private var showDepositForm = false
    @State private var showAddGoal = false
    @State private var editingDeposit: Deposit?
    @State private var showPhotoSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground(photo: viewModel.currentGoal?.uiImage)

                if let goal = viewModel.currentGoal {
                    content(for: goal)
                } else {
                    ContentUnavailableView {
                        Label(L10n.tr("home.noGoals"), systemImage: "bicycle")
                    } actions: {
                        Button(L10n.tr("goals.switcher.add"), systemImage: "plus") { showAddGoal = true }
                            .buttonStyle(.glassProminent)
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    GoalSwitcherMenu()
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
            .sheet(isPresented: $showAddGoal) { AddGoalSheet() }
            .sheet(isPresented: $showPhotoSheet) {
                if let goal = viewModel.currentGoal {
                    GoalPhotoSheet(goal: goal)
                }
            }
        }
    }

    @ViewBuilder
    private func content(for goal: Goal) -> some View {
        let stats = goal.stats
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                UpdateBanner()

                if let name = profile.displayName {
                    Text(L10n.tr("header.hello", name))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                GoalPhotoView(goal: goal, cornerRadius: 34)
                    .frame(height: 240)
                    .overlay(alignment: .bottomTrailing) {
                        Button { showPhotoSheet = true } label: {
                            Image(systemName: "camera.fill")
                        }
                        .buttonStyle(.glass)
                        .buttonBorderShape(.circle)
                        .padding(14)
                        .accessibilityLabel(L10n.tr("photo.change"))
                    }
                    .onTapGesture { showPhotoSheet = true }

                // minimalistycznie: duży procent, pasek, jedna linijka kwot
                VStack(alignment: .leading, spacing: 12) {
                    Text(Money.percent(stats.progress))
                        .font(.system(size: 76, weight: .bold, design: .rounded).monospacedDigit())
                        .contentTransition(.numericText(value: stats.progress))
                    GlassProgressBar(progress: stats.progress)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(Money.format(stats.total)).font(.headline.monospacedDigit())
                        Text(verbatim: "/ \(Money.formatShort(goal.targetAmount))")
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                    Text(stats.isAchieved ? L10n.tr("home.achieved") : L10n.tr("home.remainingLine", Money.format(stats.remaining)))
                        .font(.subheadline)
                        .foregroundStyle(stats.isAchieved ? .green : .secondary)
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
