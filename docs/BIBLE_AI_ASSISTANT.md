# Bible Assistant

## Configuration

- Set `GEMINI_API_KEY` in the server environment (local `.env`, Vercel environment settings).
- Set `GEMINI_MODEL=gemini-3.1-flash-lite`, or another compatible Gemini text model supporting JSON-schema output. Model configuration is server-only.
- Never use a `NEXT_PUBLIC_` prefix. Never commit a real key. Rotate keys shared in chat or screenshots.
- Apply the additive migration: `npx prisma migrate deploy`. It creates only the assistant's rate-limit table. Generate the client with `npx prisma generate` when preparing a deployment.
- Redeploy after setting production environment variables. No changes to Clerk or existing member permissions are required.

## Data Flow

1. `/bible?tab=assistant` sends a question (maximum 500 characters) and the six most recent question/answer pairs to `POST /api/bible/assistant`. Each historical answer is limited to 2,000 characters. The browser sends reference identifiers, never old passage extracts or URLs. The server validates these identifiers again. Older open tabs sending `previousQuestions` remain compatible.
2. A structured Gemini discovery call uses the recent conversation to resolve pronouns, clarify the subject, rewrite a standalone question and propose up to eight references and keywords. Broader biblical/Christian knowledge is allowed for discovery and interpretation, not for supplying verse text. No Google Search tools, browsing or external Bible websites are enabled or needed.
3. Every proposed book, chapter and verse is checked against the installed corpus. Invalid references are dropped, never silently substituted. Retrieval reuses `bible-data.ts`, the existing search and chapter byte indexes; no duplicate corpus or embedding service. Accent folding, vocabulary expansion, plural variants and contextual name aliases supplement discovered references. Book counts come from `books.json`.
4. A final generation call receives the standalone question, recent conversation and verified passages. Context is capped at ten passage sources, 80 verses and 20,000 passage characters, plus a small local catalogue when relevant. Long chapters use precisely labelled excerpts of up to 30 verses. History helps understanding but is explicitly untrusted, never evidence.
5. Structured answers use known citation markers and contiguous local evidence word sequences (case, punctuation and whitespace normalized; words and accents preserved). Paragraphs with invented references, quotations, URLs or malformed evidence are discarded. Known redundant markers missing evidence are removed before verification; at least one evidenced citation must remain. A separate verification call checks numbered paragraphs against the remaining sources, allows supported explanations and explicitly qualified theological interpretations, and removes unsupported claims. If none pass, the assistant returns the French insufficient-context response. Displayed extracts always use the original corpus, never model-generated quotations.
6. Citation labels, links and displayed extracts are generated from local data, never from model-generated URLs or verse text. Links reopen the existing reader and highlight the selection.

No probabilistic model can guarantee perfect interpretation or exhaustive discovery. Reference existence and displayed verse text are checked deterministically, while interpretation remains probabilistic. The UI identifies generated answers and encourages checking cited passages. An insufficient-context response does not assert that the entire Bible lacks an answer.

## Limits and Privacy

- Same-origin JSON POST; streamed request body limited to 64 KB. Question/answer lengths, reference counts and history length are validated independently.
- Atomic PostgreSQL rate limits shared across Vercel instances: visitors get 8 questions / 10 minutes and 30 / 24 hours per IP. Signed-in users with an ACTIVE membership get four times that allowance: 32 / 10 minutes and 120 / 24 hours per member account, shared across devices and text/voice questions. Pending, suspended, rejected, archived and missing memberships retain the visitor allowance. Clerk verifies the session; membership is read from the database on every request, never from client headers or metadata.
- The shared application cap remains 1,000 questions / 24 hours, including members. Windows start with the first accepted request, not at midnight. A rejected request rolls back all counter increments. Requests that pass the limiter still count if the AI provider subsequently fails. Each supported answer uses up to three Gemini requests (discovery, explanation, verification), with a 52-second total workflow deadline and 22-second per-call timeout. Configure Google API quotas/budget alerts as an additional spending safeguard.
- Vercel's overwritten `x-vercel-forwarded-for` is used only on Vercel. Other environments share a conservative visitor bucket; active members still have independent account buckets. Do not trust arbitrary forwarded headers without configuring a trusted proxy.
- IPs and member account IDs are HMAC-hashed in quota keys; questions, answers and raw addresses are not stored in the rate-limit table or application logs. Expired buckets are removed on successful requests. Rotating the key changes per-IP and per-member hashes but not the global bucket.
- Rate-limit/database failures fail closed. Responses are `no-store`; provider details and secrets are not returned. Provider timeouts and errors have generic French messages.
- The conversation is stored only in the current tab's `sessionStorage`, limited to 12 turns, with a clear-conversation action. Browser session restoration can restore sessionStorage; clear it on shared devices. The question, six recent exchanges and retrieved passages are transmitted to Google Gemini under the configured Google account's data-processing terms.
- Aborting a request stops waiting in the app; a request already accepted by the provider may still incur usage.

## Voice Questions

- The microphone uses `getUserMedia` and `MediaRecorder`, only after a tap and browser permission. HTTPS is required outside localhost. Modern Safari, Chrome and other browsers with MediaRecorder and Web Audio are supported; unsupported browsers keep text input available.
- Capture stops at 90 seconds or when the page is hidden. Users can listen, discard or send the recording. Permission denial, device interruption and conversion failures show French errors. Leaving the assistant stops the microphone and releases resources.
- The compact recording bar shows actual microphone energy, with cancel, stop and send controls. Stop opens custom playback with waveform seeking; Send can finish and submit a recording directly. Cancelling during preparation never uploads the audio. Visualisation respects reduced motion and releases its AudioContext on stop; idle previews do not run an animation loop.
- Native Web Audio decodes/resamples the browser's recording to mono 16 kHz, 16-bit PCM WAV. The upload is at most 2,880,044 bytes, below Vercel's 4.5 MB request limit. The server validates the exact WAV header and actual sample count (0.5 to 90 seconds), MIME type, streamed upload size and conversation history. It does not trust a client duration field.
- `POST /api/bible/assistant/audio` shares the text endpoint's same-origin guard and database quotas. Gemini receives inline audio with the server-only API key, transcribes it, then the existing retrieval/grounding pipeline generates a text answer. No browser speech-recognition service, public key, Google search or duplicate Bible corpus is used.
- Voice adds one Gemini call (up to four total). The route allows 90 seconds, with an 80-second deadline. A transcription is capped at 3,000 characters; text questions retain their 500-character limit. Recent history accepts voice transcripts. Silence/unintelligible audio returns 422, rather than an invented question.
- Audio stays in browser memory until sent/discarded or the page is left, and in server memory while processing; it is not stored in the app database, sessionStorage, logs or Gemini Files API. Google receives it under the configured account's processing terms. Session history stores only the transcription and text answer. A failed/cancelled request keeps the local recording available to retry.
- The fixed composer is portalled outside animated page ancestors, aligns with the content, respects mobile navigation/visual viewport changes, and reserves scroll space below the last answer. Copy controls sit below generated text; typewriter animation respects reduced motion.

Audio API: https://ai.google.dev/gemini-api/docs/generate-content/audio
Vercel payload limit: https://vercel.com/docs/functions/limitations

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Test suggestions, follow-up questions, unknown/off-topic questions, multiple references, range highlights, browser back, reset, reduced motion, light/dark themes and mobile layouts.
The reader/search remains usable when Gemini is missing, unavailable or rate-limited.

Gemini REST contract: https://ai.google.dev/api/generate-content
Structured output: https://ai.google.dev/gemini-api/docs/structured-output
