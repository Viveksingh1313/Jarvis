import aiosqlite
from datetime import datetime
from typing import List, Dict
from config import DB_PATH


async def init_db() -> None:
    """Initialize the SQLite database and create tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()


async def save_message(role: str, content: str) -> None:
    """Save a message to the conversation history.
    
    Args:
        role: Either 'user' or 'assistant'
        content: The message content
    """
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO conversations (role, content, timestamp) VALUES (?, ?, ?)",
            (role, content, datetime.now().isoformat())
        )
        await db.commit()


async def get_history(limit: int = 10) -> List[Dict[str, str]]:
    """Get the most recent conversation history.
    
    Args:
        limit: Maximum number of exchanges to retrieve
        
    Returns:
        List of dicts with 'role' and 'content' keys
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT role, content FROM conversations 
            ORDER BY id DESC 
            LIMIT ?
            """,
            (limit * 2,)  # *2 because each exchange has user + assistant
        )
        rows = await cursor.fetchall()
        
    # Reverse to get chronological order
    return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]


async def clear_history() -> None:
    """Delete all conversation history."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM conversations")
        await db.commit()
