import asyncio
import logging
import re
from typing import AsyncGenerator, List, Dict
from groq import Groq
from config import GROQ_API_KEY, SYSTEM_PROMPT, MAX_HISTORY

logger = logging.getLogger(__name__)

# Groq model - llama3 is fast and capable
MODEL = "llama-3.1-8b-instant"


class LLMService:
    """LLM service using Groq API."""
    
    def __init__(self):
        self._initialized = False
        self.client = None
        
    def initialize(self) -> None:
        """Initialize the Groq API."""
        if self._initialized:
            return
            
        if not GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set. LLM service will use fallback responses.")
            self._initialized = True
            return
        
        try:
            self.client = Groq(api_key=GROQ_API_KEY)
            logger.info(f"LLM service initialized with Groq ({MODEL})")
        except Exception as e:
            logger.error(f"Groq initialization failed: {e}")
            
        self._initialized = True
        
    async def get_response(self, user_input: str, history: List[Dict[str, str]]) -> str:
        """Get a response from the LLM."""
        if not self._initialized:
            self.initialize()
            
        if not self.client:
            return self._fallback_response()
            
        messages = self._build_messages(history, user_input)
        
        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"LLM error: {e}")
            return self._fallback_response()
        
    async def get_response_streaming(
        self, 
        user_input: str, 
        history: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """Get a streaming response, yielding complete sentences."""
        if not self._initialized:
            self.initialize()
            
        if not self.client:
            yield self._fallback_response()
            return
            
        messages = self._build_messages(history, user_input)
        
        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                stream=True
            )
            
            buffer = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    buffer += chunk.choices[0].delta.content
                    
                    sentences = self._extract_sentences(buffer)
                    for sentence in sentences[:-1]:
                        if sentence.strip():
                            yield sentence.strip()
                            
                    if sentences:
                        buffer = sentences[-1]
                        
            if buffer.strip():
                yield buffer.strip()
                
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield self._fallback_response()
            
    def _build_messages(self, history: List[Dict[str, str]], user_input: str) -> list:
        """Build messages list for Groq API."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        recent_history = history[-(MAX_HISTORY * 2):]
        for msg in recent_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
            
        messages.append({"role": "user", "content": user_input})
        
        return messages
        
    def _extract_sentences(self, text: str) -> List[str]:
        """Split text into sentences at punctuation boundaries."""
        parts = re.split(r'(?<=[.!?])\s+', text)
        return parts
        
    def _fallback_response(self) -> str:
        """Return a fallback response when the API is unavailable."""
        return "Systems momentarily unavailable, sir. Please ensure the GROQ_API_KEY is configured correctly."


# Global instance
llm_service = LLMService()
