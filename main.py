import asyncio
import os
from livekit import rtc, agents
from livekit.agents.voice import AgentSession
from livekit.agents import RoomInputOptions
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
)
from agent import AssistantAgent
from dotenv import load_dotenv
from prompts import PROMPTS


load_dotenv('.env', override=True)


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=openai.stt.STT(model="gpt-4o-transcribe"),
        llm=openai.llm.LLM(model="o4-mini"),
        tts=openai.tts.TTS(
            model="gpt-4o-mini-tts",
            voice="alloy",
            instructions=PROMPTS["tts_instructions"],
            speed=1.2
        ),
        vad=silero.vad.VAD.load(),
        min_endpointing_delay=2,
        allow_interruptions=False,
    )

    agent = AssistantAgent(session)


    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    async def handle_participant(p: rtc.RemoteParticipant):
        feeling = p.metadata or ctx.decode_token().get("metadata", "")
        print("feeling", feeling)
        if feeling:
            await agent.start_with_feeling(feeling)

    for p in ctx.room.remote_participants.values():
        print("participant", p.identity)
        if(p.identity.startswith("user")):
            agent.set_user_id(p.identity)
            await handle_participant(p)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
