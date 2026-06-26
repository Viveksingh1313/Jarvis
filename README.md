# J.A.R.V.I.S - AI Voice Assistant

A locally-hosted, voice-first AI assistant with a holographic Arc Reactor UI — inspired by Iron Man's J.A.R.V.I.S.

## Features

- **Voice Input**: Push-to-talk with Web Speech API
- **AI Brain**: Google Gemini 1.5 Flash for intelligent responses
- **JARVIS Voice**: Piper TTS for natural speech output
- **Holographic UI**: Three.js Arc Reactor that pulses to audio
- **100% Free**: No paid APIs required

## Tech Stack

| Layer | Tool | Role |
|-------|------|------|
| STT | Web Speech API | Mic → text in browser |
| LLM | Google Gemini 1.5 Flash | AI reasoning |
| TTS | Piper TTS | Text → JARVIS voice |
| Backend | FastAPI | API server + WebSocket |
| Frontend | Three.js | Holographic UI |

## Quick Start

### 1. Setup Environment

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure API Keys

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API keys:
# - GEMINI_API_KEY from https://aistudio.google.com
# - HF_TOKEN from https://huggingface.co/settings/tokens
```

### 3. Run the Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Open the Frontend

Open `frontend/index.html` in Chrome (required for Web Speech API).

```bash
# macOS
open frontend/index.html

# Windows
start frontend/index.html

# Linux
xdg-open frontend/index.html
```

### 5. Test

- Press **Spacebar** or click the Arc Reactor to activate voice
- Say "Hello Jarvis, who are you?"
- JARVIS should reply in its British voice
- The reactor animates to the audio waveform

## Commands

| Command | Example | Response |
|---------|---------|----------|
| General QA | "What is quantum computing?" | LLM answer |
| Time & Date | "What time is it?" | System clock |
| Jokes | "Tell me a joke, Jarvis" | JARVIS-persona joke |
| Self-awareness | "Who are you?" | JARVIS persona reply |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Web Speech not working | Must use Chrome |
| WebSocket refused | Make sure uvicorn is running on port 8000 |
| Gemini 429 error | Rate limit hit; wait a minute or switch to Groq |

## Author

Built by Vivek (@vvk.code)

## License

MIT
