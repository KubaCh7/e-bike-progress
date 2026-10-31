// Krótkie, ciche dźwięki generowane w Web Audio (bez plików). Można je wyłączyć w Ustawieniach.

export type SoundName = 'deposit' | 'withdraw' | 'remove' | 'bike' | 'tick'

const KEY = 'appSounds'
let ctx: AudioContext | null = null

export function soundsEnabled() {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

export function setSoundsEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* tryb prywatny */
  }
}

/** Jedna nuta: sinus z miękkim narastaniem i wygaszeniem. */
function note(ac: AudioContext, freq: number, start: number, length: number, volume: number, type: OscillatorType = 'sine') {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

/** Odtwarza dźwięk (po interakcji użytkownika – wymóg przeglądarek). */
export function play(name: SoundName) {
  if (!soundsEnabled()) return
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime + 0.01
    switch (name) {
      case 'deposit': // dwie nuty w górę – jak wrzucona moneta
        note(ctx, 987.77, t, 0.12, 0.07)
        note(ctx, 1318.51, t + 0.08, 0.28, 0.07)
        break
      case 'withdraw': // dwie nuty w dół
        note(ctx, 659.25, t, 0.12, 0.06)
        note(ctx, 493.88, t + 0.09, 0.26, 0.06)
        break
      case 'remove': // krótki, niski stuk
        note(ctx, 220, t, 0.09, 0.07, 'triangle')
        break
      case 'bike': // krótki akord w górę
        note(ctx, 523.25, t, 0.16, 0.05)
        note(ctx, 659.25, t + 0.06, 0.16, 0.05)
        note(ctx, 783.99, t + 0.12, 0.3, 0.05)
        break
      case 'tick': // ledwie słyszalne kliknięcie
        note(ctx, 1760, t, 0.03, 0.025, 'triangle')
        break
    }
  } catch {
    /* brak dźwięku nie jest błędem */
  }
}
