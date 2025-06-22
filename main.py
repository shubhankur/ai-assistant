import asyncio
import os
from livekit import rtc
from livekit.agents.voice import AgentSession, RoomIO
from livekit.plugins import openai, silero
from agent import AssistantAgent

async def main():
    url = os.environ.get("LIVEKIT_URL")
    token = os.environ.get("LIVEKIT_TOKEN")
    room = rtc.Room()
    if url and token:
        await room.connect(url, token)
    session = AgentSession(
        stt=openai.stt.STT(model="gpt-4o-transcribe"),
        llm=openai.llm.LLM(model="gpt-4o-mini"),
        tts=openai.tts.TTS(
            model="gpt-4o-mini-tts",
            voice="alloy",
            instructions="Speak like a human conversation with calm and soothing tone.",
        ),
        vad=silero.vad.VAD.load(),
        min_endpointing_delay=2,
        allow_interruptions=False,
    )
    agent = AssistantAgent(session)
    await session.start(agent, room=room if url and token else None)
    try:
        await session.drain()
    finally:
        await session.aclose()
        if url and token:
            await room.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
