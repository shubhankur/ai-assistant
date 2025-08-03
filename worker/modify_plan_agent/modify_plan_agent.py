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

from modify_plan_agent.modify_plan_helper import save_to_server
from modify_plan_agent.modify_plan_prompts import MODIFY_PLAN_PROMPTS


class ModifyPlanAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.current_plan = None
        self.week_day = None
        self.date = None
        self.time = None
        self.timezone = None
        self.locale = None
        self.stage = 20
        self._room = None
        self.journal_chat_ctx = None
    
    async def start(self, metadata : dict):
        await self.process_metadata(metadata)
        if(self.stage == 20):
            prompt = MODIFY_PLAN_PROMPTS["init_today"].format(current_plan=self.current_plan, time=self.time)
            chat_ctx = ChatContext.empty()
            chat_ctx.add_message(role="system", content=prompt)
            await self.update_chat_ctx(chat_ctx)
            self._session.generate_reply()
        elif(self.stage == 30):
            prompt = MODIFY_PLAN_PROMPTS["init_tomorrow"].format(current_plan=self.current_plan)
            chat_ctx = ChatContext.empty()
            chat_ctx.add_message(role="system", content=prompt)
            await self.update_chat_ctx(chat_ctx)
            self._session.generate_reply()

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
            self.current_plan = metadata_json["currentPlan"]
            
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
                if(self.stage == 20):
                    print("llm_node stage 20")
                    response = ""
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                            if(len(response) >= 3 and (validation_signal.startswith(response) or response.upper() == validation_signal or response.find(validation_signal) != -1)):
                                #information collected
                                print("stage 20 information collected")
                                self.journal_chat_ctx= chat_ctx
                                if self._room is not None:
                                    await self._room.local_participant.send_text(topic="information_collected", text="information_collected")
                                await self.handle_stage20_response(chat_ctx)
                                raise StopResponse()
                            elif(len(response) > 100):
                                #do something
                                pass
                        yield chunk
                elif(self.stage == 30):
                    print("llm_node stage 30")
                    response = ""
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                            if(len(response) >= 3 and (validation_signal.startswith(response) or response.upper() == validation_signal or response.find(validation_signal) != -1)):
                                #information collected
                                print("stage 30 information collected")
                                self.journal_chat_ctx= chat_ctx
                                if self._room is not None:
                                    await self._room.local_participant.send_text(topic="information_collected", text="information_collected")
                                await self.handle_stage20_response(chat_ctx)
                                raise StopResponse()
                            elif(len(response) > 100):
                                #do something
                                pass
                        yield chunk
    
    async def handle_stage20_response(self, chat_ctx : ChatContext):
        try:
            #new plan output
            new_plan_prompt = MODIFY_PLAN_PROMPTS["new_plan_output"]
            new_plan_res = await self._llm_complete(new_plan_prompt, chat_ctx)
            print("new plan res received")
            if(new_plan_res.upper != "NOT_AVAILABLE"):
                new_plan_json = self._parse_json(new_plan_res)
                if(new_plan_json is None):
                    print("new plan response is not a valid json")
                else:
                    new_plan_json["userid"] = self.user_id
                    new_plan_json["date"] = self.date
                    new_plan_json["week_day"] = self.week_day
                    new_plan_json["timezone"] = self.timezone
                    new_plan_json["locale"] = self.locale
                    new_plan_json["version"] = 0
                    await save_to_server("/dailyPlans/save", new_plan_json)
                    if self._room is not None:
                        await self._room.local_participant.send_text(topic="new_plan", text=json.dumps(new_plan_json))
                    else:
                        print("WARN: _room is None, cannot send new_plan")
            else:
                print("no mod required")
                if self._room is not None:
                    await self._room.local_participant.send_text(topic="new_plan", text="no_modification")
                else:
                    print("WARN: _room is None, cannot send new_plan")
        except Exception as e:
            print(f"Error handling stage20 response: {str(e)}")
            raise
    
    async def handle_stage30_response(self, chat_ctx : ChatContext):
        try:
            #new plan output
            tomorrow_new_plan_prompt = MODIFY_PLAN_PROMPTS["tomorrow_new_plan_prompt"]
            tomorrow_new_plan_res = await self._llm_complete(tomorrow_new_plan_prompt, chat_ctx)
            print("tomorrow new plan res received")
            if(tomorrow_new_plan_res.upper != "NOT_AVAILABLE"):
                tomorrow_new_plan_json = self._parse_json(tomorrow_new_plan_res)
                if(tomorrow_new_plan_json is None):
                    print("tomorrow new plan response is not a valid json")
                else:
                    tomorrow_new_plan_json["userid"] = self.user_id
                    tomorrow_new_plan_json["date"] = self.date
                    tomorrow_new_plan_json["week_day"] = self.week_day
                    tomorrow_new_plan_json["timezone"] = self.timezone
                    tomorrow_new_plan_json["locale"] = self.locale
                    tomorrow_new_plan_json["version"] = 0
                    await save_to_server("/dailyPlans/save", tomorrow_new_plan_json)
                    if self._room is not None:
                        await self._room.local_participant.send_text(topic="new_plan", text=json.dumps(tomorrow_new_plan_json))
                    else:
                        print("WARN: _room is None, cannot send new_plan")
            else:
                print("no mod required")
                if self._room is not None:
                    await self._room.local_participant.send_text(topic="new_plan", text="no_modification")
                else:
                    print("WARN: _room is None, cannot send new_plan")
        except Exception as e:
            print(f"Error handling stage30 response: {str(e)}")
            raise

    async def on_shutdown(self):
        if(self.journal_chat_ctx):
            try:
                #journal output
                journal_prompt = MODIFY_PLAN_PROMPTS["journal_prompt"]
                journal_res = await self._llm_complete(journal_prompt, self.journal_chat_ctx)
                print("Journal Res Received")
                if(journal_res.upper == "NOT_AVAILABLE"):
                    print("journal save not required")
                    return
                journal_json = self._parse_json(journal_res)
                if(journal_json is None):
                    print("journal response is not a valid json")
                else:
                    journal_json["userid"] = self.user_id
                    journal_json["date"] = self.date
                    journal_json["week_day"] = self.week_day
                    journal_json["timezone"] = self.timezone
                    journal_json["locale"] = self.locale
                    journal_json["version"] = 0
                    await save_to_server("/journals/save", journal_json)
            except Exception as e:
                print("journal ", journal_res)
                print(f"Error handling journal creation: {str(e)}")

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

    def set_room(self, room : Room):
        self._room = room