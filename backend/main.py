import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from config import PORT
from memory_service import init_db, save_message, get_history
from tts_service import tts_service
from llm_service import llm_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    logger.info("Starting JARVIS backend...")
    await init_db()
    logger.info("Database initialized")
    
    await tts_service.initialize()
    logger.info("TTS service initialized")
    
    llm_service.initialize()
    logger.info("LLM service initialized")
    
    logger.info(f"JARVIS backend ready on port {PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down JARVIS backend...")


app = FastAPI(
    title="JARVIS API",
    description="Just A Rather Very Intelligent System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static files
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/")
async def root():
    """Serve the frontend index.html."""
    index_path = frontend_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "JARVIS API is running. Frontend not found."}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "tts": "edge-tts",
        "service": "JARVIS"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time voice interaction."""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive text message (speech transcript from browser)
            data = await websocket.receive_text()
            user_input = data.strip()
            
            if not user_input:
                continue
                
            logger.info(f"Received: {user_input}")
            
            # Send status update
            await websocket.send_text(json.dumps({
                "type": "status",
                "text": "Processing..."
            }))
            
            # Save user message to memory
            await save_message("user", user_input)
            
            # Get conversation history
            history = await get_history()
            
            # Stream response from LLM
            full_response = ""
            
            async for sentence in llm_service.get_response_streaming(user_input, history):
                logger.info(f"LLM sentence: {sentence}")
                full_response += sentence + " "
                
                # Send status with current sentence
                await websocket.send_text(json.dumps({
                    "type": "sentence",
                    "text": sentence
                }))
                
                # Generate TTS audio for this sentence
                try:
                    audio_bytes = await tts_service.synthesize_async(sentence)
                    
                    if audio_bytes:
                        # Send audio as binary
                        await websocket.send_bytes(audio_bytes)
                    
                except Exception as e:
                    logger.error(f"TTS error: {e}")
                    
            # Save assistant response to memory
            await save_message("assistant", full_response.strip())
            
            # Send completion status
            await websocket.send_text(json.dumps({
                "type": "status",
                "text": "Ready"
            }))
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
