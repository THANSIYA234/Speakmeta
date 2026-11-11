#!/usr/bin/env python3
"""Local, free, OpenAI-compatible speech-to-text server.

Speaks the subset of the OpenAI audio API that the SpeakMate server uses:

    POST /v1/audio/transcriptions   multipart: file, model, language
    -> {"text": "...", "duration": 1.23}

Backed by faster-whisper (CTranslate2) on the CPU. Audio is normalised to
16 kHz mono WAV with ffmpeg before it reaches the model, so the WebM/MP4
recordings the browser sends work unchanged.

Environment:
    WHISPER_MODEL     model name (default: base)
    WHISPER_DEVICE    cpu | cuda (default: cpu)
    WHISPER_COMPUTE   int8 | int8_float16 | float16 | float32 (default: int8)
    WHISPER_HOST      bind address (default: 127.0.0.1)
    WHISPER_PORT      port (default: 9000)
"""

import os
import subprocess
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")
HOST = os.environ.get("WHISPER_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_PORT", "9000"))

app = FastAPI(title="Local Whisper (OpenAI-compatible)")
_model = None


def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE)
    return _model


def to_wav16k(src: str, dst: str) -> None:
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", src, "-ar", "16000", "-ac", "1", "-f", "wav", dst,
        ],
        check=True,
    )


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "device": DEVICE}


@app.post("/v1/audio/transcriptions")
async def transcriptions(
    file: UploadFile = File(...),
    model: str = Form("whisper-1"),
    language: str = Form(""),
):
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "input")
        wav = os.path.join(tmp, "input.wav")
        with open(raw, "wb") as handle:
            handle.write(await file.read())

        try:
            to_wav16k(raw, wav)
        except subprocess.CalledProcessError as exc:
            raise HTTPException(status_code=400, detail="Unreadable audio.") from exc

        segments, info = get_model().transcribe(
            wav,
            language=(language or None),
            vad_filter=True,
        )
        text = "".join(segment.text for segment in segments).strip()

    return JSONResponse(
        {
            "text": text,
            "language": info.language,
            "duration": info.duration,
        }
    )
