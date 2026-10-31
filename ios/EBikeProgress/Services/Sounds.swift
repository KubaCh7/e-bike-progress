import AVFoundation
import SwiftUI

/// Krótkie, ciche dźwięki generowane w kodzie (bez plików), jak na stronie.
/// Szanują przełącznik wyciszenia iPhone'a (kategoria .ambient) i ustawienie „Dźwięki”.
@MainActor
final class Sounds {
    enum Name { case tap, deposit, withdraw, remove, bike }

    static let shared = Sounds()
    static let enabledKey = "appSounds"

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private var started = false
    private var cache: [Name: AVAudioPCMBuffer] = [:]

    var isEnabled: Bool {
        UserDefaults.standard.object(forKey: Self.enabledKey) as? Bool ?? true
    }

    private init() {}

    private var lastPlayed: [Name: Date] = [:]

    func play(_ name: Name) {
        guard isEnabled else { return }
        // ten sam dźwięk kilka razy w ułamku sekundy (np. kilka e-bike'ów naraz) gra raz
        if let last = lastPlayed[name], Date.now.timeIntervalSince(last) < 0.25 { return }
        lastPlayed[name] = .now
        guard startIfNeeded(), let buffer = buffer(for: name) else { return }
        player.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
        if !player.isPlaying { player.play() }
    }

    private func startIfNeeded() -> Bool {
        if started { return true }
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
            engine.attach(player)
            engine.connect(player, to: engine.mainMixerNode, format: format)
            try engine.start()
            started = true
        } catch {
            print("Sounds error: \(error)")
        }
        return started
    }

    /// (częstotliwość Hz, start s, długość s, głośność 0…1, trójkąt zamiast sinusa)
    private typealias Note = (freq: Double, start: Double, length: Double, volume: Double, triangle: Bool)

    private func notes(for name: Name) -> [Note] {
        switch name {
        case .tap: // ledwie słyszalne kliknięcie
            return [(1760, 0, 0.035, 0.05, true)]
        case .deposit: // dwie nuty w górę – jak wrzucona moneta
            return [(987.77, 0, 0.12, 0.14, false), (1318.51, 0.08, 0.28, 0.14, false)]
        case .withdraw: // dwie nuty w dół
            return [(659.25, 0, 0.12, 0.12, false), (493.88, 0.09, 0.26, 0.12, false)]
        case .remove: // krótki, niski stuk
            return [(220, 0, 0.09, 0.14, true)]
        case .bike: // krótki akord w górę
            return [(523.25, 0, 0.16, 0.1, false), (659.25, 0.06, 0.16, 0.1, false), (783.99, 0.12, 0.3, 0.1, false)]
        }
    }

    private func buffer(for name: Name) -> AVAudioPCMBuffer? {
        if let cached = cache[name] { return cached }
        let rate = format.sampleRate
        let list = notes(for: name)
        let total = (list.map { $0.start + $0.length }.max() ?? 0.1) + 0.02
        let frames = AVAudioFrameCount(total * rate)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames),
              let data = buffer.floatChannelData?[0] else { return nil }
        buffer.frameLength = frames
        for i in 0..<Int(frames) { data[i] = 0 }
        for note in list {
            let first = Int(note.start * rate)
            let count = Int(note.length * rate)
            for n in 0..<count where first + n < Int(frames) {
                let t = Double(n) / rate
                let phase = note.freq * t
                let wave = note.triangle ? (2 * abs(2 * (phase - floor(phase + 0.5))) - 1) : sin(2 * .pi * phase)
                let attack = min(t / 0.012, 1)
                let decay = exp(-6 * t / note.length)
                data[first + n] += Float(wave * attack * decay * note.volume)
            }
        }
        cache[name] = buffer
        return buffer
    }
}
