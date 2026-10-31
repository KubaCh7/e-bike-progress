import SwiftUI

/// Arkusz "Dodaj wpłatę": kwota, data (domyślnie dziś), notatka.
struct DepositFormView: View {
    let goal: Goal
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss
    @State private var model: DepositFormViewModel
    @State private var confirmDelete = false
    @FocusState private var amountFocused: Bool

    init(goal: Goal, deposit: Deposit? = nil) {
        self.goal = goal
        _model = State(initialValue: DepositFormViewModel(deposit: deposit))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack(alignment: .firstTextBaseline) {
                        TextField("0,00", text: $model.amountText)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 40, weight: .bold, design: .rounded).monospacedDigit())
                            .focused($amountFocused)
                        Text("zł")
                            .font(.title2.bold())
                            .foregroundStyle(.secondary)
                    }

                    // cztery równe przyciski w jednej linii
                    HStack(spacing: 8) {
                        ForEach([50, 100, 200, 500] as [Decimal], id: \.self) { value in
                            Button { model.add(value) } label: {
                                Text(verbatim: "+\(Money.formatShort(value))")
                                    .font(.subheadline.weight(.semibold).monospacedDigit())
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.75)
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.chipFlat)
                        }
                    }
                    .frame(maxWidth: .infinity)
                } header: {
                    Text(L10n.tr("deposit.amount"))
                } footer: {
                    if !model.amountText.isEmpty && !model.isValid {
                        Text(L10n.tr("deposit.invalidAmount")).foregroundStyle(.red)
                    }
                }

                Section {
                    DatePicker(L10n.tr("deposit.date"), selection: $model.date, in: ...Date.now.addingTimeInterval(86_400 * 365), displayedComponents: .date)
                    TextField(L10n.tr("deposit.notePlaceholder"), text: $model.note, axis: .vertical)
                        .lineLimit(1...4)
                } header: {
                    Text(L10n.tr("deposit.details"))
                } footer: {
                    Text(L10n.tr("deposit.goalFooter", goal.name))
                }

                if model.isEditing {
                    Section {
                        Button(L10n.tr("deposit.delete"), role: .destructive) {
                            confirmDelete = true
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .navigationTitle(model.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.tr("common.cancel"), systemImage: "xmark") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.tr("common.save"), systemImage: "checkmark") {
                        if model.save(using: goals, goal: goal) { dismiss() }
                    }
                    .tint(.primary)
                    .disabled(!model.isValid)
                }
            }
            .confirmationDialog(L10n.tr("history.confirmDelete"), isPresented: $confirmDelete, titleVisibility: .visible) {
                Button(L10n.tr("common.delete"), role: .destructive) {
                    model.delete(using: goals)
                    dismiss()
                }
            }
            .onAppear { if !model.isEditing { amountFocused = true } }
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    let container = PersistenceController.preview
    let vm = GoalsViewModel(repository: GoalRepository(context: container.mainContext))
    return DepositFormView(goal: vm.currentGoal!)
        .environment(vm)
}
