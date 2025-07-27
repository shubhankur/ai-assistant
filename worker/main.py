from livekit import rtc, agents
from livekit.agents.voice import AgentSession
from livekit.agents import RoomInputOptions
from livekit.agents.types import APIConnectOptions
from livekit.agents.voice.agent_session import SessionConnectOptions
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
)
from onboarding_agent import OnboardingAgent
from day_agent import DayAgent
from dotenv import load_dotenv
from onboarding_prompts import ONBOARDING_PROMPTS
import json
import asyncio
load_dotenv('.env', override=True)

def createSession() -> AgentSession :
    session_opts = SessionConnectOptions(
        llm_conn_options=APIConnectOptions(
            timeout=60.0,          # <= raise per-request limit
            max_retry=3,            # keep whatever retry policy you like
            retry_interval=2.0
        )
    )

    session = AgentSession(
        stt=openai.stt.STT(model="gpt-4o-transcribe"),
        llm=openai.llm.LLM(model="o4-mini"),
        tts=openai.tts.TTS(
            model="gpt-4o-mini-tts",
            voice="alloy",
            instructions=ONBOARDING_PROMPTS["tts_instructions"],
            speed=1.2
        ),
        vad=silero.vad.VAD.load(),
        min_endpointing_delay=2,
        allow_interruptions=False,
        conn_options = session_opts
    )
    return session

async def entrypoint(ctx: agents.JobContext):
    session = createSession()
    agent = OnboardingAgent(session)
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

    for p in ctx.room.remote_participants.values():
        print("participant", p.identity)
        if(p.identity.startswith("user")):
            metadata = p.metadata or ctx.decode_token().get("metadata", "")
            print("metadata", metadata)
            metadataJson = json.loads(metadata)
            stage = int(metadataJson['stage'])
            if(stage == 1):
                def participant_attributes_changed_sync(attributes, participant):
                    asyncio.create_task(agent.on_participant_attribute_changed(attributes, participant))
                def on_room_disconnected_sync(reason):
                    asyncio.create_task(agent.on_room_disconnected(reason))
                agent.set_room(ctx.room)
                ctx.room.on("participant_attributes_changed", participant_attributes_changed_sync)
                ctx.room.on("disconnected", on_room_disconnected_sync)
                feeling = metadataJson['feelings']
                date = metadataJson['date']
                if feeling:
                    await agent.start(feeling, date)
                else:
                    raise Exception("Must send feeling when starting at stage 1")
            elif(stage == 6):
                new_agent = DayAgent(session)
                session.update_agent(new_agent)
        else:
            print("Error: Participant is not a user.")

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
