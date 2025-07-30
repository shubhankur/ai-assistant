from livekit import rtc, agents
from livekit.agents.voice import AgentSession
from livekit.agents import RoomInputOptions, WorkerOptions
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
import os
from http_utils import api_get
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

async def verify_user_exists(user_id: str) -> bool:
    """
    Verify that a user exists by making a GET request to the server API.
    
    Args:
        user_id (str): The user ID to verify
        
    Returns:
        bool: True if user exists, False otherwise
    """
    url = f"auth/verify-user/{user_id}"
    try:
        response, user_data = await api_get(url)
        if response.status == 200:
            print(f"User {user_id} verified successfully: {user_data.get('name', 'Unknown')}")
            return True
        elif response.status == 404:
            print(f"User {user_id} not found")
            return False
        else:
            print(f"Error verifying user {user_id}: HTTP {response.status}")
            return False
    except Exception as e:
        print(f"Failed to verify user {user_id}: {str(e)}")
        return False

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
                        close_on_disconnect=False
                    ),
                )

    for p in ctx.room.remote_participants.values():
        print("participant", p.identity)
        if(p.identity):
            metadata = p.metadata
            print("metadata", metadata)
            try:
                metadataJson = json.loads(metadata)
                if 'stage' not in metadataJson:
                    print("Error: No stage found in metadata")
                    return
                
                # Extract user ID from metadata and verify user exists
                user_id = metadataJson['userId']
                if(user_id is None or user_id != p.identity):
                    print(f"Error: User Id {user_id} or Participant Id {p.identity} Incorrect")
                    return
                if user_id:
                    user_exists = await verify_user_exists(user_id)
                    if not user_exists:
                        print(f"Error: User {user_id} not found in database")
                        return
                else:
                    print("Warning: No userId found in metadata")
                
                stage = int(metadataJson['stage'])
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Error parsing metadata: {str(e)}")
                return
            if(stage == 1):
                def participant_attributes_changed_sync(attributes, participant):
                    asyncio.create_task(agent.on_participant_attribute_changed(attributes, participant))
                def on_participant_disconnected_sync(reason):
                    asyncio.create_task(agent.on_participant_disconnected(reason))
                agent.set_room(ctx.room)
                ctx.room.on("participant_attributes_changed", participant_attributes_changed_sync)
                ctx.room.on("participant_disconnected", on_participant_disconnected_sync)
                await agent.start(metadataJson)
            elif(stage == 6):
                new_agent = DayAgent(session)
                session.update_agent(new_agent)
        else:
            print("Error: Participant identity is none.")

if __name__ == "__main__":
    opts = WorkerOptions(
        entrypoint_fnc = entrypoint,
        shutdown_process_timeout=300,
        drain_timeout=1800,
    )
    agents.cli.run_app(
        opts,
        hot_reload=False
        )
