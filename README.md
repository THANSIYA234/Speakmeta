# SpeakMate AI — Phase 3: Speech to Text

Mobile-first English learning dashboard built with React, TypeScript, Vite and Material UI.

Phase 1 delivered the UI shell with mock content. Phase 2 added real audio capture: the learner
records their answer with the microphone, replays it, and deletes or re-records it. Phase 3 turns
that recording into text: the learner transcribes the take, fixes any mistakes the speech-to-text
provider made, and hands the corrected transcript over for grammar correction — a phase that is
still ahead.

## Installation

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom
```

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
npm run lint       # oxlint
npm test           # run the test suite once
npm run test:watch # run the test suite in watch mode
npm run server     # start the backend (server/, watches for changes)
npm run server:test # run the backend test suite
```

The backend lives in `server/` and has its own dependencies and tests. See
`server/README.md` for the API, the environment variables and the provider setup.

The microphone only works on a secure origin. `http://localhost` counts as secure, but a plain
`http://` LAN address does not, so the app is not reachable over the network during development.

## Configuration

| Variable             | Default                | Purpose                                     |
| -------------------- | ---------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the backend the browser calls  |

The backend URL is baked in at build time. A trailing slash on the value is ignored, so both
`http://localhost:3000` and `http://localhost:3000/` work.

## Folder structure

```
src/
├─ main.tsx                  # React root, ThemeProvider, CssBaseline
├─ App.tsx                   # Route table (React Router)
├─ theme/
│  ├─ theme.ts               # Palette, radii, typography, component overrides
│  └─ global.css             # Font import, keyframes, base resets
├─ types/index.ts            # Topic, Challenge, DailyProgress, UserProfile, VoiceRecording
├─ data/mockData.ts          # Mock topics, daily challenge, progress, profile
├─ layouts/AppLayout.tsx     # Screen shell: scroll reset + bottom navigation
├─ api/
│  └─ transcription.ts       # Speech-to-text client: multipart upload, typed errors
├─ hooks/
│  ├─ useVoiceRecorder.ts    # MediaRecorder wrapper: state machine, timer, errors
│  └─ useTranscription.ts    # Transcription request lifecycle: upload, success, error
├─ utils/
│  ├─ format.ts              # Duration and byte formatting
│  └─ upload.ts              # Recording -> File for the speech-to-text upload
├─ components/
│  ├─ AppHeader.tsx          # Sticky header: logo, title, back, avatar
│  ├─ BottomNavigation.tsx   # Mobile bottom navigation bar
│  ├─ DesktopNav.tsx         # Inline navigation for >= md screens
│  ├─ navItems.tsx           # Shared navigation items and active-route helper
│  ├─ Logo.tsx               # Gradient logomark + wordmark
│  ├─ TopicCard.tsx          # Selectable topic card
│  ├─ ProgressCard.tsx       # Goal card with linear progress
│  ├─ SpeakingButton.tsx     # Mic/stop button with pulsing recording state
│  ├─ VoiceRecorder.tsx      # Reusable recorder: status, timer, playback, delete
│  ├─ AudioPlayer.tsx        # Native player for the recorded blob
│  ├─ TranscriptionCard.tsx  # Transcription display, editable draft, submit action
│  └─ StatCard.tsx           # Compact metric tile
├─ screens/
│  ├─ Welcome.tsx            # Landing screen
│  ├─ Dashboard.tsx          # Greeting, daily challenge, progress, streak, goal
│  ├─ TopicSelection.tsx     # Topic grid
│  ├─ SpeakingPractice.tsx   # Prompt, instructions, recorder, transcription
│  └─ Profile.tsx            # User info, level, sessions, skill progress
└─ test/
   ├─ setup.ts               # jest-dom matchers
   └─ fakeMediaRecorder.ts   # MediaRecorder / getUserMedia doubles

server/
├─ src/
│  ├─ main.ts                # Bootstrap: global prefix, CORS, port
│  ├─ app.module.ts          # ConfigModule + TranscriptionModule
│  ├─ config/
│  │  └─ configuration.ts    # Environment reading and validation
│  └─ transcription/
│     ├─ transcription.controller.ts # POST /api/transcription
│     ├─ transcription.service.ts    # Validation rules + provider call
│     ├─ audio-validation.ts         # Allowed types, size limit, container sniffing
│     ├─ audio-transcode.ts          # Converts uploads the provider does not accept
│     └─ providers/                  # OpenAI, MiniMax and mock providers
└─ .env.example              # Backend configuration template
```

## Routes

| Path                | Screen            |
| ------------------- | ----------------- |
| `/`                 | Welcome           |
| `/dashboard`        | Dashboard         |
| `/topics`           | Topic selection   |
| `/practice`         | Redirects to `/practice/daily-life` |
| `/practice/:topicId`| Speaking practice |
| `/profile`          | Profile           |

## Design tokens

| Token          | Value     |
| -------------- | --------- |
| Primary        | `#7C5CFF` |
| Primary dark   | `#5B3FE0` |
| Secondary      | `#B9A6FF` |
| Background     | `#F7F5FF` |
| Card surface   | `#FFFFFF` |
| Text           | `#171A3B` |
| Card radius    | `24px`    |

## Voice recording

`VoiceRecorder` is a self-contained component: give it `onRecordingComplete` and it handles
permission, recording, playback and cleanup. `useVoiceRecorder` owns the `MediaRecorder` state
machine, and the practice screen consumes it.

| Requirement          | Where it lives                                        |
| -------------------- | ----------------------------------------------------- |
| MediaRecorder API    | `hooks/useVoiceRecorder.ts`                           |
| Microphone permission| `getUserMedia` call, `RecorderError` mapping          |
| Start / pause / stop | `useVoiceRecorder` `start`, `pause`, `resume`, `stop` |
| Live timer           | `setInterval` in the hook, rendered in `VoiceRecorder`|
| Replay               | `components/AudioPlayer.tsx`                          |
| Delete and re-record | `discard` in the hook, buttons in `VoiceRecorder`     |
| Status display       | Status chip in `VoiceRecorder`                        |
| Error handling       | `toRecorderError` maps `DOMException` to a message    |
| Mobile support       | Container negotiation, pause fallback, duration fix   |

### How MediaRecorder works

`MediaRecorder` turns a live `MediaStream` into a compressed audio file in the browser.

1. **`getUserMedia`** asks for the microphone and returns a `MediaStream`. The browser shows the
   permission prompt at this point, and the promise rejects with a `DOMException` if the user
   declines.
2. **`new MediaRecorder(stream, options)`** binds a recorder to that stream. The container
   (`audio/webm` on Chrome and Firefox, `audio/mp4` on Safari) is negotiated with
   `MediaRecorder.isTypeSupported`, because the browser does not record one format everywhere.
3. **`start()`** begins capturing. Passing a timeslice flushes a chunk every second, which keeps
   memory bounded during a long take instead of holding everything until the end.
4. **`ondataavailable`** fires with each chunk. The chunks are collected and joined into one
   `Blob` when the recording stops.
5. **`stop()`** ends the capture and fires `onstop`, where the final blob is assembled.
6. **`pause()` / `resume()`** suspend and continue the capture. Not every browser supports them,
   which is why a failed pause disables the button instead of throwing the take away.

The audio stays in memory until the learner asks for it: the finished `Blob` is exposed through
`onRecordingComplete`, alongside the object URL used for playback, and it is only uploaded when
the transcription is requested.

### Storing the recording

`VoiceRecording` carries the `Blob`, the object URL, the container, the duration, the size and the
file name the recording will get. `utils/upload.ts` turns that into a named `File`, so no audio is
copied in the meantime and the same payload can be handed to the transcription upload.

| Helper                   | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `baseMimeType`           | Strips codec parameters, e.g. `audio/webm;codecs=opus` |
| `extensionForMimeType`  | Picks `.webm`, `.m4a` or `.ogg` from the container  |
| `buildRecordingFileName` | Builds `speaking-<timestamp>.<ext>`                |
| `toUploadPayload`        | Wraps the blob in a named `File`                   |

### Browser behaviour worth knowing

- **Container** — Chrome and Firefox record WebM, Safari records MP4. The recorder asks the browser
  which it supports, and falls back to the browser default if the advertised container is refused
  at construction time.
- **Duration** — files from `MediaRecorder` often carry no duration in their header, so the browser
  reports `Infinity` and the scrub bar stays empty. The player seeks past the end to force the
  browser to compute it, and falls back to the duration the recorder measured.
- **Secure context** — the microphone is only exposed over `https` or `http://localhost`. The app
  checks `window.isSecureContext` before it touches the microphone, so a page served over plain
  HTTP is reported as a connection problem rather than as a blocked permission, because those
  two problems need different fixes.

## Speech to text

The practice screen uploads the recorded take to the backend and shows the transcription in an
editable field, so the learner can fix the words before they are corrected.

| Requirement              | Where it lives                                |
| ------------------------ | --------------------------------------------- |
| Multipart upload         | `api/transcription.ts` `transcribeAudio`      |
| File validation          | Empty and > 25 MB files are rejected locally |
| Typed errors             | `TranscriptionApiError` carries the status    |
| Request lifecycle        | `hooks/useTranscription.ts`                   |
| Loading / error / result | `components/TranscriptionCard.tsx`            |
| Editable transcript      | Draft state inside `TranscriptionCard`        |

`transcribeAudio` sends the recording as `multipart/form-data` under the field `file` and posts it
to `${VITE_API_BASE_URL}/api/transcription`. The browser checks the file size before the request,
because a recording that is empty or above the 25 MB limit can never be transcribed and the
backend would only reject it again.

The hook owns the request lifecycle: it aborts the previous request when a new one starts and
aborts the in-flight request when the screen unmounts, so a slow answer can never overwrite a
newer result. `TranscriptionCard` keeps its own draft of the provider text, which means the
learner's edits survive a re-render while a fresh transcription replaces the draft.

The "Submit for correction" action sends no request: grammar correction belongs to a later phase,
so the button only acknowledges the submission in the UI.

### Tests

`npm test` runs the suite: the recorder hook (lifecycle, timer, errors, browser quirks, insecure
context), the `VoiceRecorder` component (status, playback, delete, permission failure), the
upload helpers, the transcription client (validation, upload, error mapping) and the
`TranscriptionCard` component (loading, editable result, error and retry).

## Not built yet

Grammar correction of the transcript, per-session AI feedback and scoring, persisted progress,
authentication and a backend for topics and challenges.
