/**
 * Compute mean of amplitude array (average across 56 subcarriers).
 */
export function meanAmplitude(amplitudes: number[]): number {
  if (amplitudes.length === 0) return 0
  return amplitudes.reduce((s, v) => s + v, 0) / amplitudes.length
}

/**
 * Simple moving average filter for smoothing waveforms.
 */
export function movingAverage(data: number[], windowSize = 5): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1)
    const window = data.slice(start, i + 1)
    return window.reduce((s, v) => s + v, 0) / window.length
  })
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Generate a sinusoidal signal value at time t.
 * freqHz: frequency in Hz, amplitude: peak amplitude, offset: DC offset.
 */
export function sineWave(t: number, freqHz: number, amplitude: number, offset: number): number {
  return offset + amplitude * Math.sin(2 * Math.PI * freqHz * t)
}

/**
 * Generate a heart-rate-like sharp-peak waveform.
 * Uses power of sine for sharp peaks.
 */
export function heartbeatWave(t: number, freqHz: number, amplitude: number, offset: number): number {
  const raw = Math.sin(2 * Math.PI * freqHz * t)
  return offset + amplitude * Math.pow(Math.max(0, raw), 3)
}
