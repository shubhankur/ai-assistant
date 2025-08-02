import json
import re
import time
import asyncio
from livekit.agents import llm, Agent, AgentSession, ModelSettings
from livekit.rtc import Room
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.types import APIConnectOptions
from livekit.agents.llm.tool_context import StopResponse
from livekit.rtc.participant import Participant
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN
from datetime import datetime, timedelta
from dotenv import load_dotenv
from babel.dates   import parse_date, format_date
from onboarding_agent_helper import save_to_server

class DailyPlanAgent(Agent):
    #stage1 : To Create Daily Plan
    #stage2 : User wants to talk about today, Agent will check what timen it is:
        #1. Ask about how the day is going, OR
        #2. Help with the currect activity, based on time, for example: Meditation, Reflection, etc
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self.room = None
    
    def set_room(self, room : Room):
        self.set_room = room
    


