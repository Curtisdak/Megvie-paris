"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, LoaderCircle, Pause, Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BibleVoiceWaveform } from "./bible-voice-waveform"
import type { useBibleVoice } from "./use-bible-voice"
import styles from "./bible-assistant.module.css"

function timestamp(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
}

export function BibleVoiceComposer({
  voice,
  pending,
  disabled,
  onSend,
  onCancel,
  onAbort,
}: {
  voice: ReturnType<typeof useBibleVoice>
  pending: boolean
  disabled: boolean
  onSend: (audio: Blob) => void
  onCancel: () => void
  onAbort: () => void
}) {
  const player = useRef<HTMLAudioElement>(null)
  const sending = useRef(false)
  const mounted = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [playbackError, setPlaybackError] = useState(false)
  const recording = voice.status === "recording"
  const preparing =
    voice.status === "processing" || voice.status === "permission"
  const status = pending
    ? "Écoute et recherche des passages…"
    : recording
      ? "Enregistrement en cours, 90 secondes maximum"
      : voice.status === "permission"
        ? "Autorisation du microphone…"
        : preparing
          ? "Préparation de l'audio…"
          : "Enregistrement prêt à envoyer"

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const element = player.current
    if (!voice.audio || !element) return
    const url = URL.createObjectURL(voice.audio)
    element.src = url
    return () => {
      element.pause()
      element.removeAttribute("src")
      element.load()
      URL.revokeObjectURL(url)
    }
  }, [voice.audio])

  useEffect(() => {
    if (pending) player.current?.pause()
  }, [pending])

  async function send() {
    if (sending.current || pending || disabled) return
    sending.current = true
    player.current?.pause()
    try {
      const audio = voice.audio ?? (await voice.stop())
      if (audio && mounted.current) onSend(audio)
    } finally {
      sending.current = false
    }
  }

  async function togglePlayback() {
    const element = player.current
    if (!element) return
    setPlaybackError(false)
    if (!element.paused) element.pause()
    else {
      if (element.ended) element.currentTime = 0
      try {
        await element.play()
      } catch {
        if (mounted.current) setPlaybackError(true)
      }
    }
  }

  const neutralControl =
    "shrink-0 rounded-full border border-zinc-300/80 bg-transparent text-zinc-800 shadow-none hover:bg-zinc-200/70 dark:border-zinc-600/60 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-700/80"

  return (
    <div className={styles.arrive}>
      <div
        data-voice-bar
        data-voice-state={voice.status}
        className="flex h-16 min-w-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 p-2 dark:border-zinc-700/70 dark:bg-[#242424] sm:gap-3"
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={neutralControl}
          aria-label={
            pending ? "Arrêter la réponse" : "Annuler l'enregistrement"
          }
          title={pending ? "Arrêter la réponse" : "Annuler l'enregistrement"}
          onClick={(event) => {
            event.preventDefault()
            if (pending) onAbort()
            else onCancel()
          }}
        >
          <X className="size-5" aria-hidden />
        </Button>
        <div className="relative min-w-0 flex-1 rounded focus-within:ring-2 focus-within:ring-blue-500/60">
          <BibleVoiceWaveform
            stream={recording ? voice.stream : null}
            peaks={voice.peaks}
            progress={voice.seconds ? position / voice.seconds : 0}
          />
          {voice.audio && !pending && (
            <input
              type="range"
              min={0}
              max={voice.seconds}
              step={0.1}
              value={position}
              aria-label="Position de lecture de l'enregistrement"
              aria-valuetext={`${timestamp(position)} sur ${timestamp(voice.seconds)}`}
              className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => {
                const next = Number(event.target.value)
                if (player.current) player.current.currentTime = next
                setPosition(next)
              }}
            />
          )}
        </div>
        <span
          aria-hidden
          className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400 sm:block"
        >
          {timestamp(playing ? position : voice.seconds)}
        </span>
        {preparing || pending ? (
          <span className="grid size-11 shrink-0 place-items-center text-zinc-500 dark:text-zinc-300">
            <LoaderCircle
              className="size-5 motion-safe:animate-spin"
              aria-hidden
            />
          </span>
        ) : (
          <Button
            key={recording ? "stop-recording" : "play-recording"}
            type="button"
            size="icon"
            variant="ghost"
            className={neutralControl}
            aria-label={
              recording
                ? "Terminer l'enregistrement"
                : playing
                  ? "Mettre en pause"
                  : "Écouter l'enregistrement"
            }
            title={
              recording
                ? "Terminer l'enregistrement"
                : playing
                  ? "Mettre en pause"
                  : "Écouter l'enregistrement"
            }
            onClick={(event) => {
              event.preventDefault()
              if (recording) void voice.stop()
              else void togglePlayback()
            }}
          >
            {recording ? (
              <Square className="size-3.5 fill-current" aria-hidden />
            ) : playing ? (
              <Pause className="size-4 fill-current" aria-hidden />
            ) : (
              <Play className="size-4 fill-current" aria-hidden />
            )}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          className="shrink-0 rounded-full bg-[#2d65c5] text-white shadow-none hover:bg-blue-700 disabled:opacity-40 dark:bg-[#3878df] dark:text-white dark:hover:bg-blue-500"
          aria-label="Envoyer la question vocale"
          title="Envoyer la question vocale"
          disabled={
            disabled ||
            pending ||
            preparing ||
            (recording && voice.seconds < 0.5)
          }
          onClick={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <ArrowUp className="size-5" aria-hidden />
        </Button>
        <audio
          ref={player}
          hidden
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setPosition(player.current?.currentTime ?? 0)}
          onEnded={() => {
            setPlaying(false)
            setPosition(0)
          }}
          onError={() => {
            if (player.current?.getAttribute("src")) setPlaybackError(true)
          }}
        />
      </div>
      <div
        className="mt-1.5 flex items-center justify-between gap-3 px-3 text-[10px] text-muted-foreground sm:hidden"
        aria-hidden
      >
        <span>
          {recording
            ? "Enregistrement"
            : pending
              ? "Envoi"
              : preparing
                ? "Préparation"
                : "Audio"}
        </span>
        <span className="tabular-nums">
          {timestamp(playing ? position : voice.seconds)} / 1:30
        </span>
      </div>
      <p role="status" className="sr-only">
        {status}
      </p>
      {playbackError && (
        <p
          role="alert"
          className="px-3 pt-2 text-xs text-red-700 dark:text-red-300"
        >
          Impossible de lire cet audio. Vous pouvez réessayer ou l&apos;envoyer.
        </p>
      )}
    </div>
  )
}
