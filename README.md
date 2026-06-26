# J.A.R.V.I.S - AI Voice Assistant

A locally-hosted, voice-first AI assistant with a holographic Arc Reactor UI — inspired by Iron Man's J.A.R.V.I.S.

![JARVIS UI](https://img.shields.io/badge/UI-Three.js-blue) ![Python](https://img.shields.io/badge/Backend-FastAPI-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Voice Input**: Push-to-talk (Spacebar) or click-to-talk with Web Speech API
- **AI Brain**: Groq API with Llama 3.1 for fast, intelligent responses
- **JARVIS Voice**: Google TTS with British English accent
- **Holographic UI**: Three.js Arc Reactor that pulses to audio in real-time
- **Conversation Memory**: SQLite stores chat history
- **100% Free**: No paid APIs required

## Tech Stack

| Layer | Tool | Role |
|-------|------|------|
| STT | Web Speech API | Voice → text (Chrome) |
| LLM | Groq (Llama 3.1) | AI reasoning & responses |
| TTS | gTTS | Text → British voice |
| Backend | FastAPI + WebSocket | Real-time communication |
| Frontend | Three.js + Vanilla JS | Holographic Arc Reactor UI |
| Database | SQLite | Conversation memory |

## Quick Start

### 1. Clone & Setup Environment

```bash
git clone https://github.com/Viveksingh1313/Jarvis.git
cd Jarvis/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Get Your Free Groq API Key

1. Go to https://console.groq.com
2. Sign up (Google/GitHub)
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_`)

### 3. Configure API Key

```bash
# From project root
cp .env.example .env
```

Edit `.env` and add your key:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### 4. Run the Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Open in Browser

Open **Chrome** and go to:
```
http://localhost:8000
```

> **Note**: Must use Chrome for Web Speech API support.

### 6. Test

- Press **Spacebar** or click the Arc Reactor to speak
- Say "Hello Jarvis, who are you?"
- JARVIS will respond with a British accent
- The reactor pulses to the audio

## Project Structure

```
Jarvis/
├── backend/
│   ├── main.py           # FastAPI server + WebSocket
│   ├── llm_service.py    # Groq API integration
│   ├── tts_service.py    # Text-to-speech (gTTS)
│   ├── memory_service.py # SQLite conversation history
│   ├── config.py         # Configuration
│   └── requirements.txt
├── frontend/
│   ├── index.html        # Main UI
│   ├── reactor.js        # Three.js Arc Reactor
│   ├── voice.js          # Web Speech API
│   ├── socket.js         # WebSocket + audio playback
│   └── style.css         # Iron Man theme
├── .env.example          # Environment template
└── README.md
```

## Commands

| Command | Example | Response |
|---------|---------|----------|
| General QA | "What is quantum computing?" | AI-generated answer |
| Jokes | "Tell me a joke, Jarvis" | JARVIS-persona humor |
| Self-awareness | "Who are you?" | JARVIS introduction |
| Conversation | "What did I ask before?" | Uses memory context |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Web Speech not working | Must use Chrome browser |
| WebSocket connection refused | Ensure backend is running on port 8000 |
| "Systems unavailable" response | Check GROQ_API_KEY in .env |
| No audio playing | Check browser audio permissions |
| CORS errors | Access via http://localhost:8000, not file:// |

## API Limits (Free Tier)

| Service | Limit |
|---------|-------|
| Groq | 14,400 requests/day |
| gTTS | Unlimited (uses Google Translate) |
| Web Speech API | Unlimited (browser-based) |

## Author

Built by Vivek ([@vvk.code](https://instagram.com/vvk.code))

## License

MIT
