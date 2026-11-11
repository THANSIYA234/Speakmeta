# SpeakMate API — speech-to-text

The NestJS backend for SpeakMate AI. Phase 3 adds one capability: turning an
uploaded recording into text.

## Running it

```bash
npm install --prefix server
cp server/.env.example server/.env   # then fill in OPENAI_API_KEY
npm run server                       # http://localhost:3000/api
```

Without an API key the process refuses to start, so a misconfigured deployment
fails loudly instead of failing on the first upload. For local work without a
key, set `STT_PROVIDER=mock` in `server/.env`: the provider returns a canned
transcript and no network call is made.

| Variable              | Default                     | Purpose                                        |
| --------------------- | --------------------------- | ---------------------------------------------- |
| `STT_PROVIDER`        | `openai`                    | `openai` or `mock`                             |
| `OPENAI_API_KEY`      | —                           | Required for `openai`                          |
| `OPENAI_BASE_URL`     | `https://api.openai.com/v1` | Override for a compatible endpoint              |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1`              | The transcription model                         |
| `OPENAI_TIMEOUT_MS`   | `120000`                    | Provider request timeout                       |
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
                          └── MockProvider    → canned text, no network
```

| File                                          | Responsibility                                     |
| --------------------------------------------- | -------------------------------------------------- |
| `src/transcription/transcription.controller.ts` | HTTP layer: multipart parsing, response shape      |
| `src/transcription/transcription.service.ts`   | Validation rules and the provider call             |
| `src/transcription/audio-validation.ts`        | Allowed types, size limit, container sniffing      |
| `src/transcription/providers/`                 | The provider implementations behind one interface  |
| `src/config/configuration.ts`                  | Reads and validates the environment                |

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

31 tests cover the container sniffing and the validation rules, the service
behaviour (rejections, language handling, provider errors) and the HTTP layer
end to end through supertest.

## Adding another provider

Implement `SpeechToTextProvider` in `src/transcription/providers/`, then wire
it in `transcription.module.ts` behind a new `STT_PROVIDER` value. Nothing in
the controller or the service has to change.
