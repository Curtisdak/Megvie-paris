export function audioLevel(samples: Float32Array): number {
  if (!samples.length) return 0
  let energy = 0
  for (const sample of samples) energy += sample * sample
  return Math.min(1, Math.pow(Math.sqrt(energy / samples.length) * 4, 0.65))
}

export function audioPeaks(samples: Float32Array, count = 128): number[] {
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * samples.length) / count)
    const end = Math.floor(((index + 1) * samples.length) / count)
    return audioLevel(samples.subarray(start, end))
  })
}
