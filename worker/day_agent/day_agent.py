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
from babel.dates   import parse_date, format_date
from .day_agent_helper import get_weekly_routine, save_to_server
from .day_agent_prompts import DAILY_PLAN_PROMPTS

class DailyPlanAgent(Agent):
    #stage1 : To Create Daily Plan
    #stage2 : User wants to talk about today, Agent will check what timen it is:
        #1. Ask about how the day is going, OR
        #2. Help with the currect activity, based on time, for example: Meditation, Reflection, etc
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self._room = None
        self.week_day = None
        self.date = None
        self.time = None
        self.timezone = None
        self.locale = None
        self.stage = 10
        self.with_time = False
        self.isTomorrow = None

    async def start(self, metadata_json : dict) -> None:
        await self.process_metadata(metadata_json)

        if(self.stage == 10):
            #build from scratch, user was not onboarded
            #check current time
            if self.time is not None and datetime.strptime(self.time, "%H:%M:%S").time() > datetime.strptime("04:00:00", "%H:%M:%S").time():
                #user is already up
                prompt = DAILY_PLAN_PROMPTS['build_daily_plan_scratch_with_time'].format(time=self.time)
                self.with_time = True
            else:
                if(self.isTomorrow and self.isTomorrow.lower() == "true"):
                    day = "tomorrow"
                else:
                    day = "today"
                prompt = DAILY_PLAN_PROMPTS['build_daily_plan_scratch'].format(day=day)
            chat_ctx = ChatContext.empty()
            chat_ctx.add_message(role="system", content=prompt)
            await self.update_chat_ctx(chat_ctx)
            self._session.generate_reply()

        if(self.stage == 11):
            # Get the user's weekly routine
            weekly_routine = await get_weekly_routine(self.user_id)
            if(weekly_routine):
                today_routine = weekly_routine["today"]

    async def llm_node(
            self,
            chat_ctx: llm.ChatContext,
            tools: list[FunctionTool | RawFunctionTool],
            model_settings: ModelSettings,
        ) -> AsyncGenerator[llm.ChatChunk | str, None]:
            """Default implementation for `Agent.llm_node`"""
            activity = self._get_activity_or_raise()
            assert activity.llm is not None, "llm_node called but no LLM node is available"
            assert isinstance(activity.llm, llm.LLM), (
                "llm_node should only be used with LLM (non-multimodal/realtime APIs) nodes"
            )
            tool_choice = model_settings.tool_choice if model_settings else NOT_GIVEN
            activity_llm = activity.llm

            conn_options = activity.session.conn_options.llm_conn_options
            async with activity_llm.chat(
                chat_ctx=chat_ctx, tools=tools, tool_choice=tool_choice, conn_options=conn_options
            ) as stream:
                if(self.stage == 10):
                    print("llm_node stage10")
                    response = ""
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                            if(len(response) >= 3 and (validation_signal.startswith(response) or response.upper() == validation_signal or response.find(validation_signal) != -1)):
                                print("stage 10 information collected")
                                if self._room is not None:
                                    await self._room.local_participant.send_text(topic="information_collected", text="information_collected")
                                #generate daily plan
                                await self.handle_daily_plan_res(chat_ctx)
                                raise StopResponse()
                            elif(len(response) > 100):
                                #do something
                                pass
                        yield chunk


    async def handle_daily_plan_res(self, chat_ctx : ChatContext):
        try:
            day_plan_json = await self.get_daily_plan(chat_ctx)
            if(day_plan_json is None):
                #ToDo: Maybe ask to regenerate
                print("Error: today_plan_response was not a valid json")
            else:
                #save to mongo
                day_plan_json["userid"] = self.user_id
                day_plan_json["date"] = self.date
                day_plan_json["week_day"] = self.week_day
                day_plan_json["timezone"] = self.timezone
                day_plan_json["locale"] = self.locale
                day_plan_json["version"] = 0
                # Save tomorrow_plan_json to server
                await save_to_server("dailyPlans/save", day_plan_json)
                if self._room is not None:
                    await self._room.local_participant.send_text(topic="day_plan", text=json.dumps(day_plan_json))
                else:
                    print("WARN: _room is None, cannot send day_plan")
        except:
            #ToDo: Do something about it.
            raise

    async def get_daily_plan(self, chat_ctx : llm.ChatContext) -> dict | None:
        if(self.with_time):
            day_plan_prompt = DAILY_PLAN_PROMPTS["daily_plan_scratch_with_time_output"]
        else:
            day_plan_prompt = DAILY_PLAN_PROMPTS["daily_plan_scratch_output"]
        day_plan_res = await self._llm_complete(day_plan_prompt, chat_ctx)
        print("Daily Plan Res Received")
        day_plan_json = self._parse_json(day_plan_res)
        return day_plan_json
    
    async def _llm_complete(self, system_prompt: str, chat_ctx: llm.ChatContext) -> str:
        try:
            local_ctx = chat_ctx.copy()
            local_ctx.add_message(role="system", content=system_prompt)
            llm_conn_options = APIConnectOptions(
                timeout=120.0,          # <= raise per-request limit
                max_retry=3,            # keep whatever retry policy you like
                retry_interval=2.0
            )
            assert isinstance(self._session.llm, llm.LLM), (
                "llm_complete should only be used with LLM (non-multimodal/realtime APIs) nodes"
            )
            stream = self._session.llm.chat(chat_ctx=local_ctx, conn_options=llm_conn_options)
            parts: list[str] = []
            async for chunk in stream:
                if chunk.delta and chunk.delta.content:
                    parts.append(chunk.delta.content)
            await stream.aclose()
            #ToDO: Verify this response is not added to the context
            return "".join(parts).strip()
        except Exception as e:
            print("ERROR in LLM Complete ", e)
            raise
    
    def _parse_json(self, text: str) -> dict | None:
        """Attempt to parse a JSON object from the given text."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    return None
            return None

    async def process_metadata(self, metadata_json):
        if(self._room is None):
            raise Exception("Room is not set for the agent.")
        try:
            self.user_id = metadata_json["userId"]
            #verify participant id
            for p in self._room.remote_participants.values():
                if(p.identity != self.user_id):
                    await self._room.disconnect()
                    raise Exception("Participant Id should be same as the User Id")
                
            self.stage = int(metadata_json["stage"])
            
            self.isTomorrow = metadata_json["isTomorrow"]
            # day as integer
            day = int(metadata_json["day"])
            print("day received: ", day)
            if day < 0 or day > 6:
                raise ValueError("Day must be between 0 and 6")
            
            days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            self.week_day = days[day] 
            print("today ", self.week_day)
            
            if "timezone" not in metadata_json:
                raise KeyError("Timezone missing from metadata")
            self.timezone = metadata_json["timezone"]

            # parse date for today and tomorrow
            if "locale" not in metadata_json:
                raise KeyError("Locale missing from metadata")
            loc:str = metadata_json["locale"]
            self.locale = loc
            loc = loc.replace("-", "_")
            
            try:
                today_date = parse_date(metadata_json["date"], locale=loc)
                self.date = format_date(today_date, format="yyyy-MM-dd", locale=loc)
            except ValueError as e:
                raise ValueError(f"Error parsing dates: {str(e)}")

            # received as '19:10:16 GMT-0400 (Eastern Daylight Time)'
            if "time" not in metadata_json:
                raise KeyError("Time missing from metadata")
            time : str = metadata_json["time"]
            try:
                self.time = time.split(" ")[0]
            except IndexError:
                raise ValueError("Invalid time format")
                
        except Exception as e:
            print(f"Error processing metadata: {str(e)}")
            raise

    def set_room(self, room : Room):
        self._room = room
    


