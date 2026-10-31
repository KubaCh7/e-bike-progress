import SwiftUI

/// Powitanie po założeniu konta / pierwszym uruchomieniu:
/// 1) imię, 2) wybór e-bike'ów z katalogu (e-ride pro SR zaznaczony domyślnie) albo własny.
struct OnboardingView: View {
    @Environment(GoalsViewModel.self) private var goals
    @Environment(ProfileStore.self) private var profile
    @Environment(CatalogStore.self) private var catalog

    @State private var step = 0
    @State private var name = ""
    // nic nie jest zaznaczone z góry – użytkownik sam wybiera
    @State private var selected: [String] = []
    @State private var showCustom = false
    @State private var isSaving = false
    @FocusState private var nameFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()
                if step == 0 {
                    nameStep.transition(.asymmetric(insertion: .move(edge: .leading), removal: .move(edge: .leading)).combined(with: .opacity))
                } else {
                    bikesStep.transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .trailing)).combined(with: .opacity))
                }
            }
            .animation(.smooth(duration: 0.45), value: step)
            .sheet(isPresented: $showCustom) {
                GoalEditorView(goal: nil, isFirstGoal: goals.goals.isEmpty && selected.isEmpty)
            }
        }
        .onAppear {
            name = profile.displayName ?? ""
            let owned = Set(goals.goals.compactMap(\.catalogId))
            selected.removeAll { owned.contains($0) }
            if profile.displayName?.isEmpty == false { step = 1 }
        }
    }

    // MARK: - Krok 1: imię

    private var nameStep: some View {
        VStack(spacing: 22) {
            LanguagePicker()
            Spacer()
            Image("MotoIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 60)
                .foregroundStyle(.primary)
                .frame(width: 92, height: 92)
                .card(radius: 12)
            Text(L10n.tr("onboarding.helloTitle"))
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
            Text(L10n.tr("onboarding.helloText"))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            TextField(L10n.tr("profile.namePlaceholder"), text: $name)
                .font(.title2.weight(.semibold))
                .multilineTextAlignment(.center)
                .textContentType(.givenName)
                .submitLabel(.next)
                .focused($nameFocused)
                .padding(18)
                .chipBackground()
                .onSubmit(saveName)
            Spacer()
            Button(action: saveName) {
                Text(L10n.tr("common.next")).frame(maxWidth: .infinity)
            }
            .buttonStyle(.primaryFlat)
            .controlSize(.extraLarge)
            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(24)
        .onAppear { nameFocused = true }
    }

    private func saveName() {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        Task { await profile.setName(trimmed) }
        step = 1
    }

    // MARK: - Krok 2: e-bike'i

    private var bikesStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text(L10n.tr("onboarding.bikesTitle", name.trimmingCharacters(in: .whitespaces)))
                    .font(.largeTitle.bold())
                Text(L10n.tr("onboarding.bikesText"))
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 8)
                CatalogGridView(
                    selected: Set(selected),
                    disabledIDs: Set(goals.goals.compactMap(\.catalogId)),
                    onToggle: toggle,
                    onCustom: { showCustom = true }
                )
            }
            .padding()
            .padding(.bottom, 90)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .bottom) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.tr("onboarding.selected", selected.count + goals.goals.count)).font(.headline)
                    Text(Money.formatShort(total)).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: finish) {
                    if isSaving { ProgressView() } else { Text(L10n.tr("onboarding.start")) }
                }
                .buttonStyle(.primaryFlat)
                .controlSize(.large)
                .disabled(isSaving)
            }
            .padding(.leading, 20)
            .padding(8)
            .chipBackground()
            .padding(.horizontal)
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button(L10n.tr("common.back"), systemImage: "chevron.left") { step = 0 }
            }
        }
    }

    private var total: Decimal {
        selected.compactMap { id in catalog.bikes.first { $0.id == id }?.price }.reduce(0, +)
    }

    private func toggle(_ bike: CatalogBike) {
        withAnimation(.bouncy) {
            if let index = selected.firstIndex(of: bike.id) {
                selected.remove(at: index)
            } else {
                selected.append(bike.id)
            }
        }
    }

    private func finish() {
        isSaving = true
        let hadDefault = goals.defaultGoal != nil
        var main: Goal? = goals.defaultGoal
        for (index, id) in selected.enumerated() {
            guard let bike = catalog.bikes.first(where: { $0.id == id }) else { continue }
            let isMain = !hadDefault && index == 0
            let goal = goals.createGoal(
                name: bike.displayName,
                target: bike.price,
                photo: nil,
                thumbnail: bike.id == AppConstants.defaultCatalogId ? ImageProcessor.suggestedThumbnail() : nil,
                photoURL: bike.id == AppConstants.defaultCatalogId ? AppConstants.suggestedPhotoURL : nil,
                makeDefault: isMain,
                catalogId: bike.id
            )
            if isMain { main = goal }
        }
        if goals.goals.isEmpty {
            // nic nie wybrano – domyślnie e-ride pro SR
            main = goals.repository.seedDefaultGoalIfNeeded()
            goals.reload()
        }
        if let main { goals.select(main) }
        Task {
            await profile.completeOnboarding()
            isSaving = false
        }
    }
}
