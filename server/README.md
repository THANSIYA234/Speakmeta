# SpeakMate API — speech-to-text

The NestJS backend for SpeakMate AI. Phase 3 adds one capability: turning an
uploaded recording into text.

## Running it

```bash
npm install --prefix server
cp server/.env.example server/.env   # then fill in the provider key
npm run server                       # http://localhost:3000/api
```

Without an API key the process refuses to start, so a misconfigured deployment
fails loudly instead of failing on the first upload. For local work without a
key, set `STT_PROVIDER=mock` in `server/.env`: the provider returns a canned
transcript and no network call is made.

| Variable              | Default                     | Purpose                                        |
| --------------------- | --------------------------- | ---------------------------------------------- |
| `STT_PROVIDER`        | `openai`                    | `openai`, `minimax` or `mock`                  |
| `OPENAI_API_KEY`      | —                           | Required for `openai`                          |
| `OPENAI_BASE_URL`     | `https://api.openai.com/v1` | Override for a compatible endpoint              |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1`              | The transcription model                         |
| `OPENAI_TIMEOUT_MS`   | `120000`                    | Provider request timeout                       |
| `MINIMAX_API_KEY`     | —                           | Required for `minimax`                         |
| `MINIMAX_BASE_URL`    | `https://api.minimax.io/v1` | Override for a compatible endpoint              |
| `MINIMAX_TRANSCRIBE_MODEL` | `asr-1.0`              | The transcription model                         |
| `MINIMAX_TIMEOUT_MS`  | `120000`                    | Provider request timeout                       |
| `MINIMAX_FFMPEG_PATH` | `ffmpeg`                    | ffmpeg binary used to convert uploads          |
| `MAX_UPLOAD_BYTES`    | `26214400` (25 MB)          | Largest accepted upload                         |
| `PORT`                | `3000`                      | HTTP port                                      |
| `CORS_ORIGINS`        | `http://localhost:5173`     | Comma-separated list of allowed browser origins |

The key is read only on the server. The browser never sees it: the React app
sends the audio to this service, and this service calls the provider.

## Endpoints

### `POST /api/transcription`

`multipart/form-data` with the audio under the field name `file`. An optional
`language` field (BCP-47, e.g. `en`) hints at the spoken language.

```bash
curl -X POST http://localhost:3000/api/transcription \
  -F "file=@recording.webm;type=audio/webm" \
  -F "language=en"
```

```json
{
  "text": "Hello, this is my answer about my daily routine.",
  "language": "en",
  "durationSeconds": 4.2,
  "provider": "openai"
}
```

Failures use the standard Nest error body, so the frontend can read
`message` directly:

```json
{ "statusCode": 400, "message": "The uploaded file is not a recognised audio file.", "error": "Bad Request" }
```

| Status | Cause                                                             |
| ------ | ----------------------------------------------------------------- |
| 400    | Missing, empty, unsupported or non-audio file; provider failure    |
| 413    | The upload is larger than `MAX_UPLOAD_BYTES`                      |

### `GET /api/transcription/provider`

Returns `{ "provider": "openai" }`. Used to confirm which provider is wired up.

## How a request flows through the code

```
browser ──multipart──▶ TranscriptionController
                          │  multer parses the body into a Buffer
                          ▼
                       TranscriptionService
                          │  validateAudioUpload: type, size, container signature
                          ▼
                       SpeechToTextProvider (interface)
                          │
                          ├── OpenAiProvider  → POST {base}/audio/transcriptions
                          ├── MiniMaxProvider → POST {base}/speech_to_text
                          └── MockProvider    → canned text, no network
```

| File                                          | Responsibility                                     |
| --------------------------------------------- | -------------------------------------------------- |
| `src/transcription/transcription.controller.ts` | HTTP layer: multipart parsing, response shape      |
| `src/transcription/transcription.service.ts`   | Validation rules and the provider call             |
| `src/transcription/audio-validation.ts`        | Allowed types, size limit, container sniffing      |
| `src/transcription/audio-transcode.ts`         | Converts uploads the provider does not accept      |
| `src/transcription/providers/`                 | The provider implementations behind one interface  |
| `src/config/configuration.ts`                  | Reads and validates the environment                |

## Providers

### OpenAI (`STT_PROVIDER=openai`)

`POST {OPENAI_BASE_URL}/audio/transcriptions` with `whisper-1`. The browser
recording is uploaded as it is.

Because `OPENAI_BASE_URL` and `OPENAI_TRANSCRIBE_MODEL` are configurable, any
endpoint that speaks the OpenAI audio API can be used in place of OpenAI
itself. Two free options:

| Option                    | `OPENAI_BASE_URL`                       | `OPENAI_TRANSCRIBE_MODEL`    | Key            | Limits                                        |
| ------------------------- | --------------------------------------- | ---------------------------- | -------------- | --------------------------------------------- |
| Groq (free tier)          | `https://api.groq.com/openai/v1`        | `whisper-large-v3-turbo`     | Groq key       | 2000 requests/day, 25 MB uploads, no card     |
| Local whisper server      | `http://127.0.0.1:9000/v1`              | `whisper-1`                 | any non-empty  | Only your machine, only your CPU              |

Groq key: sign up at <https://console.groq.com/keys>, then set

```bash
STT_PROVIDER=openai
OPENAI_API_KEY=<groq key>
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_TRANSCRIBE_MODEL=whisper-large-v3-turbo
```

The local server (`server/local-whisper/`) runs faster-whisper on the CPU behind
the same `/v1/audio/transcriptions` path, converts the browser's WebM/MP4 to
16 kHz mono WAV with `ffmpeg`, and needs no key at all:

```bash
./local-whisper/run.sh          # first run downloads the model, a few minutes
```

Then point the app at it:

```bash
STT_PROVIDER=openai
OPENAI_API_KEY=unused
OPENAI_BASE_URL=http://127.0.0.1:9000/v1
OPENAI_TRANSCRIBE_MODEL=whisper-1
```

The `base` model is the default and needs about 700 MB of RAM; `tiny` and
`small` are available through `WHISPER_MODEL`.

### MiniMax (`STT_PROVIDER=minimax`)

`POST {MINIMAX_BASE_URL}/speech_to_text` with `asr-1.0`. The endpoint is not
OpenAI-compatible, so two things differ from the OpenAI provider:

- The path is `/speech_to_text`, and the language hint travels as an HTTP
  header instead of a form field. A regional tag such as `en-gb` is sent as
  `en`; a language the endpoint does not support is left out so the endpoint
  detects it.
- The endpoint rejects the containers the browsers record. WebM and MP4/M4A
  are converted to mono 16 kHz MP3 with `ffmpeg` before the upload, which
  means `ffmpeg` has to be installed on the host running the API. Point
  `MINIMAX_FFMPEG_PATH` at the binary when it is not on the `PATH`.

The endpoint accepts up to 500 seconds of audio and 50 MB per request, and
rejects longer files instead of truncating them.

### Validation

Three checks have to pass before a file is sent to the provider:

1. **Size** — multer caps the stream at `MAX_UPLOAD_BYTES` and answers `413`
   while the upload is still arriving. The service checks the buffer length
   again, so the rule holds on any path into the service.
2. **Declared type** — the MIME type or the extension has to be one of WebM,
   OGG, MP4/M4A, MP3, WAV, FLAC or AAC.
3. **Container signature** — the first bytes are matched against the known
   audio containers (EBML for WebM, `OggS`, `RIFF`/`WAVE`, `ftyp`, `fLaC`,
   `ID3`, the MP3 frame sync). A file that claims to be audio but is not gets
   rejected, and so does a file whose contents contradict the declared type.

## Tests

```bash
npm run server:test
```

53 tests cover the container sniffing and the validation rules, the service
behaviour (rejections, language handling, provider errors), the HTTP layer end
to end through supertest, the MiniMax provider (endpoint, headers, form
fields, error envelopes) and the ffmpeg conversion.

## Adding another provider

Implement `SpeechToTextProvider` in `src/transcription/providers/`, then wire
it in `transcription.module.ts` behind a new `STT_PROVIDER` value. Nothing in
the controller or the service has to change.
