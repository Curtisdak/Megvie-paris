"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { audioLevel } from "@/lib/bible-assistant/audio-waveform"

export function BibleVoiceWaveform({
  stream,
  peaks,
  progress,
}: {
  stream: MediaStream | null
  peaks: number[]
  progress: number
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()
  const playback = useRef(progress)
  const repaint = useRef<(() => void) | null>(null)
  useEffect(() => {
    playback.current = progress
    repaint.current?.()
  }, [progress])

  useEffect(() => {
    const element = canvas.current
    const painter = element?.getContext("2d")
    if (!element || !painter) return
    let context: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let signal: Float32Array<ArrayBuffer> | null = null
    let width = 0
    let frame = 0
    let previous = 0
    let disposed = false
    const levels: number[] = []
    const paint = () => {
      const count = Math.max(1, Math.floor(width / 7))
      painter.clearRect(0, 0, width, 44)
      painter.fillStyle = getComputedStyle(element).color
      for (let index = 0; index < count; index++) {
        const level = stream
          ? (levels[levels.length - count + index] ?? 0)
          : (peaks[
              Math.min(
                peaks.length - 1,
                Math.floor((index / count) * peaks.length),
              )
            ] ?? 0)
        const height = Math.max(3, level * 42)
        painter.globalAlpha = stream
          ? level > 0.02
            ? 0.9
            : 0.3
          : index / count < playback.current
            ? 1
            : 0.35
        painter.beginPath()
        painter.roundRect(index * 7 + 2, (44 - height) / 2, 3, height, 1.5)
        painter.fill()
      }
    }
    repaint.current = paint
    const resize = () => {
      width = element.clientWidth
      const scale = window.devicePixelRatio || 1
      element.width = Math.round(width * scale)
      element.height = Math.round(44 * scale)
      painter.setTransform(scale, 0, 0, scale, 0, 0)
      paint()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const themeObserver = new MutationObserver(paint)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    resize()
    if (stream) {
      try {
        context = new AudioContext()
        analyser = context.createAnalyser()
        analyser.fftSize = 1024
        signal = new Float32Array(analyser.fftSize)
        source = context.createMediaStreamSource(stream)
        source.connect(analyser)
        void context.resume().catch(() => {})
      } catch {
        // Recording remains available even when visualisation is unavailable.
      }
    }
    const draw = (now: number) => {
      if (disposed) return
      if (now - previous >= (reduceMotion ? 200 : 50)) {
        previous = now
        if (stream && analyser && signal) {
          analyser.getFloatTimeDomainData(signal)
          levels.push(audioLevel(signal))
          if (levels.length > 160) levels.shift()
        }
        paint()
      }
      frame = requestAnimationFrame(draw)
    }
    if (stream) frame = requestAnimationFrame(draw)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
      repaint.current = null
      source?.disconnect()
      analyser?.disconnect()
      if (context && context.state !== "closed")
        void context.close().catch(() => {})
    }
  }, [stream, peaks, reduceMotion])

  return (
    <canvas
      ref={canvas}
      data-voice-waveform
      aria-hidden
      className="block h-11 w-full text-zinc-700 dark:text-zinc-300"
    />
  )
}
