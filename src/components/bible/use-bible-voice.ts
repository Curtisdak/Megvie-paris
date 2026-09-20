"use client"

import { useEffect, useRef, useState } from "react"
import {
  BIBLE_AUDIO_MAX_SECONDS,
  BIBLE_AUDIO_SAMPLE_RATE,
  encodeBibleAudio,
} from "@/lib/bible-assistant/audio"
import { audioPeaks } from "@/lib/bible-assistant/audio-waveform"

type VoiceStatus = "idle" | "permission" | "recording" | "processing" | "ready"
type Capture = {
  recorder: MediaRecorder | null
  stream: MediaStream | null
  timer: ReturnType<typeof setInterval> | null
  generation: number
  completion: Promise<Blob | null> | null
  resolve: ((audio: Blob | null) => void) | null
}

function release(capture: Capture) {
  if (capture.timer) clearInterval(capture.timer)
  capture.timer = null
  if (capture.recorder?.state === "recording") capture.recorder.stop()
  capture.stream?.getTracks().forEach((track) => track.stop())
  capture.recorder = null
  capture.stream = null
}

export function useBibleVoice() {
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [seconds, setSeconds] = useState(0)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const capture = useRef<Capture>({
    recorder: null,
    stream: null,
    timer: null,
    generation: 0,
    completion: null,
    resolve: null,
  })
  const busy = useRef(false)

  useEffect(() => {
    const current = capture.current
    // An interruption stops capture, but keeps the recording for review.
    const interrupt = () => {
      if (document.visibilityState === "hidden") release(current)
    }
    document.addEventListener("visibilitychange", interrupt)
    return () => {
      current.generation++
      current.resolve?.(null)
      current.resolve = null
      current.completion = null
      release(current)
      document.removeEventListener("visibilitychange", interrupt)
    }
  }, [])

  function reset() {
    capture.current.generation++
    capture.current.resolve?.(null)
    capture.current.resolve = null
    capture.current.completion = null
    release(capture.current)
    busy.current = false
    setStatus("idle")
    setAudio(null)
    setStream(null)
    setPeaks([])
    setSeconds(0)
    setError(null)
  }

  function stop() {
    release(capture.current)
    setStream(null)
    return capture.current.completion ?? Promise.resolve(audio)
  }

  async function start() {
    if (busy.current) return
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined" ||
      typeof OfflineAudioContext === "undefined"
    ) {
      setError(
        "Le microphone n'est pas disponible dans ce navigateur. Utilisez Safari ou Chrome à jour, en HTTPS, ou écrivez votre question.",
      )
      return
    }
    const current = capture.current
    const generation = ++current.generation
    const active = () => current.generation === generation
    busy.current = true
    setError(null)
    setStatus("permission")
    setAudio(null)
    setSeconds(0)
    setPeaks([])
    current.completion = new Promise((resolve) => {
      current.resolve = resolve
    })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      })
      if (!active()) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      current.stream = stream
      setStream(stream)
      if (document.visibilityState === "hidden") throw new Error("Page hidden")
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64000,
      })
      current.recorder = recorder
      const chunks: Blob[] = []
      let size = 0
      recorder.ondataavailable = ({ data }) => {
        if (!active() || !data.size) return
        size += data.size
        if (size > 4 * 1024 * 1024) {
          current.generation++
          current.resolve?.(null)
          current.resolve = null
          release(current)
          setStream(null)
          busy.current = false
          setStatus("idle")
          setError(
            "L'enregistrement est trop volumineux. Essayez une question plus courte.",
          )
          return
        }
        chunks.push(data)
      }
      recorder.onerror = () => {
        if (!active()) return
        current.generation++
        current.resolve?.(null)
        current.resolve = null
        release(current)
        setStream(null)
        busy.current = false
        setStatus("idle")
        setError(
          "L'enregistrement a été interrompu. Vérifiez votre microphone et réessayez.",
        )
      }
      recorder.onstop = async () => {
        if (!active()) return
        release(current)
        setStream(null)
        setStatus("processing")
        try {
          const source = new Blob(chunks, { type: recorder.mimeType })
          if (!source.size) throw new Error("Empty recording")
          const decoder = new OfflineAudioContext(1, 1, BIBLE_AUDIO_SAMPLE_RATE)
          const decoded = await decoder.decodeAudioData(
            await source.arrayBuffer(),
          )
          if (!active()) return
          if (decoded.duration < 0.5) throw new Error("Short recording")
          const length = Math.min(
            Math.floor(decoded.duration * BIBLE_AUDIO_SAMPLE_RATE),
            BIBLE_AUDIO_MAX_SECONDS * BIBLE_AUDIO_SAMPLE_RATE,
          )
          const renderer = new OfflineAudioContext(
            1,
            length,
            BIBLE_AUDIO_SAMPLE_RATE,
          )
          const node = renderer.createBufferSource()
          node.buffer = decoded
          node.connect(renderer.destination)
          node.start()
          const rendered = await renderer.startRendering()
          if (!active()) return
          const wav = encodeBibleAudio(rendered.getChannelData(0))
          const prepared = new Blob([wav], { type: "audio/wav" })
          setAudio(prepared)
          setPeaks(audioPeaks(rendered.getChannelData(0)))
          setSeconds(length / BIBLE_AUDIO_SAMPLE_RATE)
          setStatus("ready")
          current.resolve?.(prepared)
          current.resolve = null
        } catch {
          if (active()) {
            current.resolve?.(null)
            current.resolve = null
            setStatus("idle")
            setError(
              "L'audio n'a pas pu être préparé. Enregistrez une question un peu plus longue ou utilisez le clavier.",
            )
          }
        } finally {
          if (active()) busy.current = false
        }
      }
      stream.getAudioTracks().forEach((track) =>
        track.addEventListener(
          "ended",
          () => {
            if (active()) release(current)
          },
          { once: true },
        ),
      )
      recorder.start(250)
      const started = performance.now()
      setStatus("recording")
      current.timer = setInterval(() => {
        const elapsed = Math.min(
          BIBLE_AUDIO_MAX_SECONDS,
          (performance.now() - started) / 1000,
        )
        if (active()) setSeconds(elapsed)
        if (elapsed >= BIBLE_AUDIO_MAX_SECONDS) release(current)
      }, 100)
    } catch (reason) {
      if (!active()) return
      current.generation++
      current.resolve?.(null)
      current.resolve = null
      release(current)
      setStream(null)
      busy.current = false
      setStatus("idle")
      const name = reason instanceof DOMException ? reason.name : ""
      setError(
        name === "NotAllowedError"
          ? "Accès au microphone refusé. Autorisez-le dans les réglages du navigateur ou écrivez votre question."
          : name === "NotFoundError"
            ? "Aucun microphone détecté. Branchez-en un ou écrivez votre question."
            : "Impossible d'ouvrir le microphone. Fermez les autres applications qui l'utilisent, puis réessayez.",
      )
    }
  }

  return {
    status,
    seconds,
    audio,
    stream,
    peaks,
    error,
    start,
    stop,
    reset,
    clearError: () => setError(null),
  }
}
