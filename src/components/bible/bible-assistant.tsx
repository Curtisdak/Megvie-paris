"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
} from "react";
import {
  ArrowUp,
  BookOpen,
  CircleAlert,
  Cross,
  Heart,
  HandHeart,
  LibraryBig,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildAssistantHistory } from "@/lib/bible-assistant/conversation";
import { BibleAssistantAnswer as AssistantAnswer } from "./bible-assistant-answer";
import { BibleAssistantDock } from "./bible-assistant-dock";
import { BibleVoiceComposer } from "./bible-voice-composer";
import { useBibleVoice } from "./use-bible-voice";
import styles from "./bible-assistant.module.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BIBLE_QUESTION_MAX_LENGTH,
  BIBLE_TRANSCRIPT_MAX_LENGTH,
  BIBLE_SESSION_MAX_TURNS,
  type BibleAssistantAnswer,
  type BibleAssistantTurn,
  type BibleCitation,
} from "@/lib/bible-assistant/types";

const sessionKey = "megvie-bible-assistant-v1";
const suggestions = [
  { question: "Que dit la Bible sur la foi ?", icon: HandHeart },
  { question: "Qui était Moïse ?", icon: UserRound },
  { question: "Parle-moi de Jésus.", icon: Cross },
  { question: "Que dit la Bible sur le pardon ?", icon: Heart },
  {
    question: "Combien de livres contient le Nouveau Testament ?",
    icon: LibraryBig,
  },
];

const questionClassName =
  "ml-auto w-fit max-w-[94%] rounded-lg border border-amber-200/70 bg-amber-50 px-4 py-3 text-[15px] leading-6 break-words text-amber-950 [overflow-wrap:anywhere] dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-100 sm:max-w-[82%] sm:px-5 sm:py-4";

function isAnswer(value: unknown): value is BibleAssistantAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as BibleAssistantAnswer;
  return (
    typeof answer.insufficient === "boolean" &&
    Array.isArray(answer.paragraphs) &&
    answer.paragraphs.length <= 5 &&
    answer.paragraphs.every(
      (paragraph) => typeof paragraph === "string" && paragraph.length <= 1400,
    ) &&
    Array.isArray(answer.citations) &&
    answer.citations.length <= 13 &&
    answer.citations.every(
      (source) =>
        source &&
        typeof source.id === "string" &&
        typeof source.label === "string" &&
        typeof source.text === "string" &&
        (source.href === null ||
          (typeof source.href === "string" &&
            source.href.startsWith("/bible?"))),
    )
  );
}

export function BibleAssistant({
  onReferenceOpen,
}: {
  onReferenceOpen: (citation: BibleCitation) => void;
}) {
  const [turns, setTurns] = useState<BibleAssistantTurn[]>([]);
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [clearOpen, setClearOpen] = useState(false);
  const [animatedTurnId, setAnimatedTurnId] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const responseAnchor = useRef<HTMLDivElement>(null);
  const latestTurn = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const voice = useBibleVoice();
  const voiceActive = voice.status !== "idle";
  const atLimit = turns.length >= BIBLE_SESSION_MAX_TURNS;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(sessionKey);
        if (raw && raw.length < 400000) {
          const stored: unknown = JSON.parse(raw);
          if (Array.isArray(stored))
            setTurns(
              stored
                .filter(
                  (turn): turn is BibleAssistantTurn =>
                    turn &&
                    typeof turn.id === "string" &&
                    typeof turn.question === "string" &&
                    turn.question.length <= BIBLE_TRANSCRIPT_MAX_LENGTH &&
                    isAnswer(turn.answer),
                )
                .slice(-BIBLE_SESSION_MAX_TURNS),
            );
        }
      } catch {
        /* Session storage is optional in private browsers. */
      }
      setReady(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(turns));
      } catch {}
    }
  }, [ready, turns]);

  useEffect(() => {
    if (!retryAt) return;
    const timeout = window.setTimeout(
      () => setRetryAt(0),
      Math.max(0, retryAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [retryAt]);

  useEffect(() => {
    const element = input.current;
    if (!element) return;
    const resize = () => {
      element.style.height = "auto";
      element.style.height = `${Math.min(144, Math.max(52, element.scrollHeight))}px`;
    };
    const frame = requestAnimationFrame(resize);
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [question, voiceActive]);

  const scrollToResponse = (completed = false) =>
    requestAnimationFrame(() =>
      (completed ? latestTurn.current : responseAnchor.current)?.scrollIntoView(
        {
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        },
      ),
    );

  async function ask(value: string, audio?: Blob) {
    const clean = value.trim();
    if (
      !ready ||
      controller.current ||
      atLimit ||
      (!audio &&
        (voiceActive ||
          clean.length < 3 ||
          clean.length > BIBLE_QUESTION_MAX_LENGTH)) ||
      retryAt > Date.now()
    )
      return;
    const current = new AbortController();
    controller.current = current;
    setPendingQuestion(audio ? "Question vocale" : clean);
    setError(null);
    voice.clearError();
    setAnimatedTurnId(null);
    if (!audio) setQuestion(clean);
    if (window.matchMedia("(pointer: coarse)").matches) input.current?.blur();
    scrollToResponse();
    try {
      const history = buildAssistantHistory(turns);
      const form = new FormData();
      if (audio) {
        form.append("audio", audio, "question.wav");
        form.append("history", JSON.stringify(history));
      }
      const response = await fetch(
        audio ? "/api/bible/assistant/audio" : "/api/bible/assistant",
        {
          method: "POST",
          headers: audio ? undefined : { "Content-Type": "application/json" },
          body: audio
            ? form
            : JSON.stringify({
                question: clean,
                history,
              }),
          signal: current.signal,
        },
      );
      const data = await response.json().catch(() => null);
      if (current.signal.aborted || controller.current !== current) return;
      if (!response.ok) {
        if (response.status === 429) {
          const seconds = Number(response.headers.get("Retry-After"));
          if (Number.isFinite(seconds) && seconds > 0)
            setRetryAt(Date.now() + Math.min(seconds, 86400) * 1000);
        }
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Impossible d'obtenir une réponse. Réessayez dans un instant.",
        );
      }
      const transcribedQuestion: unknown = data?.question;
      if (
        !isAnswer(data) ||
        (audio &&
          (typeof transcribedQuestion !== "string" ||
            transcribedQuestion.length < 3 ||
            transcribedQuestion.length > BIBLE_TRANSCRIPT_MAX_LENGTH))
      )
        throw new Error(
          "La réponse n'a pas pu être vérifiée. Réessayez dans un instant.",
        );
      const id = crypto.randomUUID();
      setAnimatedTurnId(id);
      setTurns((previous) => [
        ...previous,
        {
          id,
          question: audio ? (transcribedQuestion as string) : clean,
          answer: data,
          ...(audio ? { input: "voice" as const } : {}),
        },
      ]);
      if (audio) voice.reset();
      else setQuestion("");
      scrollToResponse(true);
    } catch (reason) {
      if (!current.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : "Connexion interrompue. Réessayez.",
        );
    } finally {
      if (controller.current === current) {
        controller.current = null;
        setPendingQuestion(null);
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question, voice.audio ?? undefined);
  }

  return (
    <section
      aria-labelledby="bible-assistant-title"
      className="mx-auto flex min-h-[calc(100dvh-15rem)] w-full min-w-0 max-w-3xl flex-col gap-6 pb-2 sm:gap-8"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/70 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-teal-200/70 bg-teal-50 text-teal-800 dark:border-teal-700/40 dark:bg-teal-400/10 dark:text-teal-300">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="bible-assistant-title"
              className="text-base font-semibold sm:text-lg"
            >
              Assistant biblique
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="size-3.5 shrink-0" aria-hidden /> Louis
              Segond 1910
            </p>
          </div>
        </div>
        {turns.length > 0 && (
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={Boolean(pendingQuestion) || voiceActive}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle conversation ?</DialogTitle>
                <DialogDescription>
                  Les questions et réponses de cette session seront effacées.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClearOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setTurns([]);
                    setQuestion("");
                    setError(null);
                    setAnimatedTurnId(null);
                    setClearOpen(false);
                    input.current?.focus();
                  }}
                >
                  Effacer la conversation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {!turns.length && !pendingQuestion && (
        <div className="space-y-3 pb-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Questions suggérées
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {suggestions.map(({ question: suggestion, icon: Icon }, index) => (
              <button
                key={suggestion}
                type="button"
                disabled={!ready || voiceActive || retryAt > Date.now()}
                onClick={() => void ask(suggestion)}
                style={
                  { "--suggestion-delay": `${index * 45}ms` } as CSSProperties
                }
                className={`group flex min-h-16 items-center gap-3 rounded-lg border border-border/80 bg-card/70 px-3.5 py-3 text-left text-sm transition-[border-color,background-color,transform] hover:border-teal-400/60 hover:bg-teal-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 motion-safe:active:scale-[0.99] disabled:opacity-50 dark:hover:bg-teal-950/40 sm:last:col-span-2 ${styles.suggestion}`}
              >
                <Icon
                  className="size-4 shrink-0 text-teal-700 dark:text-teal-400"
                  aria-hidden
                />
                <span className="flex-1 leading-5">{suggestion}</span>
                <ArrowUp
                  className="size-4 shrink-0 rotate-45 text-muted-foreground transition-transform motion-safe:group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        role="log"
        aria-label="Conversation biblique"
        aria-live="polite"
        aria-relevant="additions"
        className={turns.length ? "space-y-7 sm:space-y-9" : "sr-only"}
      >
        {turns.map((turn, index) => (
          <article
            key={turn.id}
            ref={index === turns.length - 1 ? latestTurn : undefined}
            className={`scroll-mt-52 space-y-5 border-b border-border/60 pb-6 last:border-0 last:pb-0 sm:scroll-mt-40 sm:space-y-6 ${styles.arrive}`}
          >
            <div className={questionClassName} data-user-question>
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800/80 dark:text-amber-300">
                {turn.input === "voice" && (
                  <Mic className="size-3" aria-hidden />
                )}
                {turn.input === "voice" ? "Vous · transcription" : "Vous"}
              </span>
              {turn.question}
            </div>
            <AssistantAnswer
              answer={turn.answer}
              animate={turn.id === animatedTurnId}
              onReferenceOpen={onReferenceOpen}
            />
          </article>
        ))}
      </div>

      <div
        ref={responseAnchor}
        className="scroll-mt-52 empty:hidden sm:scroll-mt-40"
        aria-live="polite"
      >
        {pendingQuestion && (
          <div className={`space-y-6 ${styles.arrive}`}>
            <p className={questionClassName} data-user-question>
              <span className="mb-1.5 block text-xs font-semibold text-amber-800/80 dark:text-amber-300">
                Vous
              </span>
              {pendingQuestion}
            </p>
            <div
              role="status"
              className="flex min-h-12 items-center gap-3 text-sm text-muted-foreground"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span>
                {voice.audio
                  ? "Écoute et recherche des passages…"
                  : "Recherche des passages…"}
              </span>
              <span
                className="ml-auto flex shrink-0 gap-1 text-teal-600 dark:text-teal-400"
                aria-hidden
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={`size-1.5 rounded-full bg-current ${styles.loadingDot}`}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      <BibleAssistantDock>
        <form onSubmit={submit} className="space-y-2">
          {(error || voice.error) && (
            <div
              role="alert"
              className="flex max-h-28 items-start gap-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="min-w-0 flex-1">{error || voice.error}</p>
              {error && !retryAt && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title="Réessayer"
                  aria-label="Réessayer"
                  onClick={() => void ask(question, voice.audio ?? undefined)}
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          )}
          {voiceActive ? (
            <BibleVoiceComposer
              voice={voice}
              pending={Boolean(pendingQuestion)}
              disabled={!ready || atLimit || retryAt > Date.now()}
              onSend={(audio) => void ask(question, audio)}
              onAbort={() => controller.current?.abort()}
              onCancel={() => {
                voice.reset();
                setError(null);
                requestAnimationFrame(() =>
                  input.current?.focus({ preventScroll: true }),
                );
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-zinc-300/80 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.15)] transition-[border-color,box-shadow] focus-within:border-teal-500 focus-within:ring-3 focus-within:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-teal-400">
              <label htmlFor="bible-assistant-question" className="sr-only">
                Votre question
              </label>
              <Textarea
                ref={input}
                id="bible-assistant-question"
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  voice.clearError();
                }}
                readOnly={Boolean(pendingQuestion)}
                disabled={atLimit}
                rows={1}
                maxLength={BIBLE_QUESTION_MAX_LENGTH}
                enterKeyHint="enter"
                placeholder={
                  turns.length
                    ? "Que souhaitez-vous approfondir ?"
                    : "Que dit la Bible sur…"
                }
                className="min-h-[52px] max-h-[min(9rem,22dvh)] resize-none overflow-y-auto rounded-none border-0 bg-transparent px-5 pb-2 pt-4 text-base leading-6 shadow-none [field-sizing:fixed] focus-visible:ring-0 dark:bg-transparent min-[1025px]:text-base"
                aria-describedby="bible-assistant-notice"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !window.matchMedia("(pointer: coarse)").matches &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void ask(question);
                  }
                }}
              />
              <div className="flex min-h-14 items-center justify-between gap-2 px-3 pb-2">
                <span
                  className={`pl-1 text-xs tabular-nums ${question.length >= 450 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}
                  aria-live="off"
                >
                  {question.length
                    ? `${question.length}/${BIBLE_QUESTION_MAX_LENGTH}`
                    : "Message vocal · 90 s max"}
                </span>
                <div className="flex items-center gap-1">
                  {question && !pendingQuestion && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Effacer la question"
                      title="Effacer la question"
                      className="text-muted-foreground"
                      onClick={() => {
                        setQuestion("");
                        input.current?.focus();
                      }}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  )}
                  {!pendingQuestion && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Enregistrer une question vocale"
                      title="Enregistrer une question vocale (90 secondes maximum)"
                      disabled={!ready || atLimit || retryAt > Date.now()}
                      onClick={() => {
                        input.current?.blur();
                        setError(null);
                        void voice.start();
                      }}
                    >
                      <Mic className="size-5" aria-hidden />
                    </Button>
                  )}
                  {pendingQuestion ? (
                    <Button
                      key="stop"
                      type="button"
                      size="icon"
                      variant="outline"
                      title="Arrêter la réponse"
                      aria-label="Arrêter la réponse"
                      onClick={(event) => {
                        event.preventDefault();
                        controller.current?.abort();
                      }}
                    >
                      <Square className="size-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      key="send"
                      type="submit"
                      size="icon"
                      className="rounded-full bg-teal-800 text-white shadow-sm hover:bg-teal-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:opacity-100 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                      disabled={
                        !ready ||
                        question.trim().length < 3 ||
                        atLimit ||
                        retryAt > Date.now()
                      }
                      title="Envoyer la question"
                      aria-label="Envoyer la question"
                    >
                      <ArrowUp className="size-5" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <p
            id="bible-assistant-notice"
            className="px-2 text-center text-[10px] leading-4 text-muted-foreground sm:text-[11px]"
          >
            {atLimit
              ? "Conversation complète. Commencez une nouvelle conversation pour continuer."
              : voiceActive
                ? "Votre audio est transmis au service d'IA uniquement à l'envoi."
                : "L'IA peut se tromper. Vérifiez les passages cités."}
          </p>
        </form>
      </BibleAssistantDock>
    </section>
  );
}
