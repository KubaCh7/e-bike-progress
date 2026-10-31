import SwiftUI

/// Dodawanie własnego e-bike'a lub edycja istniejącego celu.
struct GoalEditorView: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(\.dismiss) private var dismiss
    @State private var model: GoalEditorViewModel

    init(goal: Goal?, preset: CatalogBike? = nil, isFirstGoal: Bool = false) {
        _model = State(initialValue: GoalEditorViewModel(goal: goal, preset: preset, isFirstGoal: isFirstGoal))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    photoPreview
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }

                Section(L10n.tr("goals.photo")) {
                    PhotoSourceButtons(
                        showSuggested: model.canSuggestPhoto,
                        canRemove: model.hasPhoto,
                        onPicked: { result in withAnimation(.smooth) { model.pick(result) } },
                        onSuggested: { withAnimation(.smooth) { model.suggest() } },
                        onRemove: { withAnimation(.smooth) { model.clearPhoto() } }
                    )
                    .listRowBackground(Color.clear)
                }

                Section {
                    TextField(L10n.tr("goals.namePlaceholder"), text: $model.name)
                        .textInputAutocapitalization(.words)
                } header: {
                    Text(L10n.tr("goals.name"))
                }

                Section {
                    HStack {
                        TextField("30 000,00", text: $model.priceText)
                            .keyboardType(.decimalPad)
                            .font(.title3.monospacedDigit())
                        Text("zł").foregroundStyle(.secondary)
                    }
                } header: {
                    Text(L10n.tr("goals.price"))
                } footer: {
                    if !model.priceText.isEmpty && model.price.map({ $0 <= 0 }) ?? true {
                        Text(L10n.tr("goals.invalidPrice")).foregroundStyle(.red)
                    }
                }

                Section {
                    Toggle(L10n.tr("goals.makeDefault"), isOn: $model.makeDefault)
                        .disabled(model.editing?.isDefault == true)
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
                        if model.save(using: goals) { dismiss() }
                    }
                    .buttonStyle(.glassProminent)
                    .disabled(!model.isValid)
                }
            }
        }
    }

    private var photoPreview: some View {
        Color.clear
            .frame(height: 200)
            .overlay {
                if let image = model.previewImage {
                    Image(uiImage: image).resizable().scaledToFill()
                } else {
                    PhotoPlaceholder(bike: model.catalogBike)
                }
            }
            .clipShape(.rect(cornerRadius: 26))
            .animation(.smooth, value: model.hasPhoto)
    }
}

#Preview {
    let container = PersistenceController.preview
    let vm = GoalsViewModel(repository: GoalRepository(context: container.mainContext))
    return GoalEditorView(goal: nil).environment(vm)
}
