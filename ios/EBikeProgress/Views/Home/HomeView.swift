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
                            .buttonStyle(.primaryFlat)
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
        let tint = goal.catalogBike?.dataTint ?? .primary
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                UpdateBanner()

                // nazwa e-bike'a i jedno zdanie: kiedy go kupisz
                VStack(alignment: .leading, spacing: 4) {
                    Text(goal.name)
                        .font(.title2.weight(.semibold))
                    Text(findingLine(stats))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 4)

                // zdjęcie + uzbierane / cena + pasek
                VStack(alignment: .leading, spacing: 14) {
                    Button { showPhotoSheet = true } label: {
                        GoalPhotoView(goal: goal, cornerRadius: 8, emptyHint: L10n.tr("photo.add"))
                            .aspectRatio(4 / 3, contentMode: .fit)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(L10n.tr("photo.change"))

                    HStack(alignment: .lastTextBaseline) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(L10n.tr("home.saved"))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            HStack(alignment: .firstTextBaseline, spacing: 6) {
                                Text(Money.formatShort(stats.total))
                                    .font(.system(size: 30, weight: .bold).monospacedDigit())
                                    .contentTransition(.numericText())
                                Text(L10n.tr("home.ofPrice", Money.formatShort(goal.targetAmount)))
                                    .font(.subheadline.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer(minLength: 8)
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(stats.isAchieved ? L10n.tr("home.saved") : L10n.tr("home.remaining"))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text(stats.isAchieved ? Money.percent(1) : Money.formatShort(stats.remaining))
                                .font(.headline.monospacedDigit())
                        }
                    }

                    GlassProgressBar(progress: stats.progress, tint: tint)
                    HStack {
                        Text(Money.percent(stats.progress))
                        Spacer()
                        Text(Money.formatShort(goal.targetAmount))
                    }
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                }
                .padding(16)
                .card()

                // cztery liczby w jednym podzielonym pasku
                Grid(horizontalSpacing: 0, verticalSpacing: 0) {
                    GridRow {
                        kpi(L10n.tr("stats.thisMonth"), Money.formatShort(stats.thisMonth))
                        kpi(L10n.tr("stats.pace"), stats.dailyRate.map { Money.formatShort(($0 * 30).rounded(scale: 0)) } ?? "—")
                    }
                    Divider()
                    GridRow {
                        kpi(L10n.tr("stats.average"), stats.average.map { Money.formatShort($0) } ?? "—")
                        kpi(L10n.tr("home.count"), "\(stats.count)")
                    }
                }
                .card()

                recentDeposits(goal: goal)
            }
            .padding(.horizontal)
            .padding(.bottom, 110)
            .animation(.smooth, value: goal.id)
        }
        .background(Color(.systemGroupedBackground))
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

    private func kpi(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.medium).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
    }

    /// „Prognoza zakupu: marzec 2027, przy tempie 1 240 zł miesięcznie.”
    private func findingLine(_ stats: SavingsStats) -> String {
        if stats.count == 0 { return L10n.tr("home.findingEmpty") }
        if stats.isAchieved { return L10n.tr("home.findingDone") }
        guard let date = stats.forecastDate, let rate = stats.dailyRate else { return L10n.tr("stats.forecastNone") }
        let month = date.formatted(.dateTime.month(.wide).year().locale(L10n.locale))
        return L10n.tr("home.findingForecast", month, Money.formatShort((rate * 30).rounded(scale: 0)))
    }

    private func recentDeposits(goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(L10n.tr("home.recent"))
                .font(.headline)
            let recent = Array(goal.sortedDeposits.prefix(5))
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
        .padding(16)
        .card()
    }
}

/// Wiersz z wpłatą: data i notatka po lewej, kwota po prawej (wypłata na czerwono z minusem).
struct DepositRow: View {
    let deposit: Deposit

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(deposit.date.formatted(.dateTime.day().month(.abbreviated).year().locale(L10n.locale)))
                    .font(.body)
                if let note = deposit.note, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                } else if deposit.amount < 0 {
                    Text(L10n.tr("deposit.withdrawal"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Text(verbatim: (deposit.amount < 0 ? "−" : "") + Money.format(abs(deposit.amount)))
                .font(.body.weight(.bold).monospacedDigit())
                .foregroundStyle(deposit.amount < 0 ? Color.red : Color.primary)
        }
        .padding(.vertical, 4)
        .contentShape(.rect)
    }
}

/// Znikający komunikat (czarna kapsuła).
struct ToastView: View {
    @Binding var message: String?

    var body: some View {
        if let message {
            Label(message, systemImage: "checkmark")
                .font(.subheadline.bold())
                .foregroundStyle(Color(.systemBackground))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.primary, in: .capsule)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: message) {
                    try? await Task.sleep(for: .seconds(2))
                    withAnimation(.smooth) { self.message = nil }
                }
        }
    }
}
