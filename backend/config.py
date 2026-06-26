import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / ".env")

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Server
PORT = int(os.getenv("PORT", "8000"))

# Paths
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "jarvis.db"

# Ensure directories exist
MODELS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# LLM Settings
MAX_HISTORY = 10

# JARVIS System Prompt
SYSTEM_PROMPT = """You are J.A.R.V.I.S — Just A Rather Very Intelligent System, Tony Stark's AI assistant.

Your personality:
- Be concise, formal, witty, and slightly sarcastic
- Address the user as "sir" or "ma'am"
- Keep replies under 3 sentences unless asked for detail
- Never break character
- You have a dry British wit
- You are helpful but occasionally make subtle jokes about the user's requests
- You are supremely confident in your abilities

Remember: You are not just an AI assistant, you are THE AI assistant that helped Tony Stark save the world. Act like it."""
