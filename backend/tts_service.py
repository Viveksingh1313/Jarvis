import io
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# British English voice
EDGE_VOICE = "en-GB-RyanNeural"


class TTSService:
    """Text-to-Speech service with multiple fallbacks."""
    
    def __init__(self):
        self._initialized = False
        self._use_gtts = False
        
    async def initialize(self) -> None:
        """Initialize the TTS service."""
        if self._initialized:
            return
        
        logger.info("Initializing TTS service...")
        
        # Test edge-tts first
        try:
            import edge_tts
            communicate = edge_tts.Communicate("test", EDGE_VOICE)
            async for _ in communicate.stream():
                break
            logger.info(f"TTS service initialized with Edge TTS (voice: {EDGE_VOICE})")
        except Exception as e:
            logger.warning(f"Edge TTS not available: {e}. Falling back to gTTS.")
            self._use_gtts = True
            logger.info("TTS service initialized with gTTS fallback")
            
        self._initialized = True
    
    async def synthesize_async(self, text: str) -> bytes:
        """Synthesize text to speech.
        
        Args:
            text: The text to synthesize
            
        Returns:
            MP3 audio bytes
        """
        if self._use_gtts:
            return await self._synthesize_gtts(text)
        else:
            return await self._synthesize_edge(text)
            
    async def _synthesize_edge(self, text: str) -> bytes:
        """Synthesize using Edge TTS."""
        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, EDGE_VOICE)
            
            audio_bytes = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes.write(chunk["data"])
                    
            return audio_bytes.getvalue()
            
        except Exception as e:
            logger.error(f"Edge TTS error: {e}")
            # Fall back to gTTS
            return await self._synthesize_gtts(text)
    
    async def _synthesize_gtts(self, text: str) -> bytes:
        """Synthesize using Google TTS (fallback)."""
        try:
            from gtts import gTTS
            import asyncio
            
            def generate():
                tts = gTTS(text=text, lang='en', tld='co.uk')  # British English
                audio_bytes = io.BytesIO()
                tts.write_to_fp(audio_bytes)
                audio_bytes.seek(0)
                return audio_bytes.getvalue()
            
            return await asyncio.to_thread(generate)
            
        except Exception as e:
            logger.error(f"gTTS error: {e}")
            return bytes()
                
    async def synthesize_streaming(self, text: str) -> AsyncGenerator[bytes, None]:
        """Synthesize text sentence by sentence for streaming."""
        sentences = self._split_sentences(text)
        
        for sentence in sentences:
            if sentence.strip():
                audio = await self.synthesize_async(sentence.strip())
                if audio:
                    yield audio
                
    def _split_sentences(self, text: str) -> list:
        """Split text into sentences."""
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s for s in sentences if s.strip()]


# Global instance
tts_service = TTSService()
