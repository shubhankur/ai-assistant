import json
import os
import re
import time
import tiktoken
import aiohttp
from livekit.plugins.openai import llm
from typing import Optional
import asyncio
from livekit.agents import llm, Agent, AgentSession, ModelSettings
from livekit.rtc import Room, DisconnectReason, RemoteParticipant
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


from onboarding_prompts import ONBOARDING_PROMPTS
load_dotenv('.env', override=True)


class OnboardingAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self._room = None
        self.stage = 1
        self.user_feeling = None
        self.user_id = None
        self.stage3_chat_ctx = None
        self.stage3_task = None
        self.stage2_turn = 0
        self.today = None
        self.tomorrow = None
        self.tomorrow_date = None
        self.today_date = None
        self.today_date_parsed = None
        self.time = None
        self.timezone = None
        self.locale = None
        self.stage3_response_json = None
        self.today_plan_json = None
        self.tomorrow_plan_json = None
        self.stage4_output_json = None
        self.habit_reformation_json = None
        self.weekly_plan_json = None
    
    async def on_participant_attribute_changed(self, attributes : dict, participant : Participant) -> None:
        if(participant.identity.startswith("user")):
            received_stage = attributes.get("stage")
            if(received_stage):
                stage = int(received_stage)
                print("received stage", stage)
                if(stage == 3):
                    await self.update_stage(3, ChatContext.empty())
                    try:
                        self.session.interrupt()
                        print("Stage 2 Interrupted!")
                    except Exception as e:
                        print("Stage 2 Interrupted! But received an error", e.__cause__)
                elif(stage == 7):
                    #ToDo: If the user has skipped. Maybe store the obtained information till now
                    await self.update_stage(7, ChatContext.empty())
                    try:
                        raise StopResponse()
                    except:
                        print("Stopped Response")
                        pass

    async def on_participant_disconnected(self, participant: RemoteParticipant):
        print("WARN: Participant Disconnected ")
        chat_ctx = self.chat_ctx
        if(self.stage >= 3):
            if(self.stage3_response_json is None):
                prompt = ONBOARDING_PROMPTS["stage3_output"]
                try:
                    stage3_response = await self._llm_complete(prompt, self.stage3_chat_ctx)
                    stage3_response_json = self._parse_json(stage3_response)
                    if(stage3_response_json is None):
                        print("Error: stage3_response was not a valid json")
                    else:
                        self.stage3_response_json = stage3_response_json
                        print("stage3 response generated")
                        stage3_response_json["userid"] = self.user_id
                        stage3_response_json["timezone"] = self.timezone
                        # Save current routine to server
                        await save_to_server("currentRoutines/save", stage3_response_json)
                except Exception as exc:
                    print(f"Stage 3 response could not be saved: {exc}")
                    return
                print("Stage 3 response ready")
        if(self.stage == 5):
            if(self.today_plan_json is None):
                try:
                    today_plan_json = await self.get_daily_plan(self.today, chat_ctx)
                    if(today_plan_json is None):
                                        #ToDo: Maybe ask to regenerate
                        print("Error: today_plan_response was not a valid json")
                    else:
                        self.today_plan_json = today_plan_json
                        print("today_plan response generated")
                        today_plan_json["userid"] = self.user_id
                        today_plan_json["date"] = self.today_date
                        today_plan_json["week_day"] = self.today
                        today_plan_json["timezone"] = self.timezone
                        today_plan_json["locale"] = self.locale
                        today_plan_json["version"] = 0
                        # Save today_plan_json to server
                        await save_to_server("dailyPlans/save", today_plan_json)
                except Exception as e:
                    print(f"Failed to get today's plan: {str(e)}")
            if(self.tomorrow_plan_json is None):
                try:
                    tomorrow_plan_json = await self.get_daily_plan(self.tomorrow, chat_ctx)
                    if(tomorrow_plan_json is None):
                                        #ToDo: Maybe ask to regenerate
                        print("Error: today_plan_response was not a valid json")
                    else:
                        self.tomorrow_plan_json = tomorrow_plan_json
                        print("today_plan response generated")
                        tomorrow_plan_json["userid"] = self.user_id
                        tomorrow_plan_json["date"] = self.tomorrow_date
                        tomorrow_plan_json["week_day"] = self.tomorrow
                        tomorrow_plan_json["timezone"] = self.timezone
                        tomorrow_plan_json["locale"] = self.locale
                        tomorrow_plan_json["version"] = 0
                        # Save tomorrow_plan_json to server
                        await save_to_server("dailyPlans/save", tomorrow_plan_json)
                except Exception as e:
                    print(f"Failed to get today's plan: {str(e)}")
            await self.handle_post_stage4()
            await self._room.disconnect()
    
    async def start(self, metadata_json : json) -> None:
        try:
            self.user_id = metadata_json["userId"]
            # day as integer
            day = int(metadata_json["day"])
            if day < 0 or day > 6:
                raise ValueError("Day must be between 0 and 6")
            
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            self.today = days[day] 
            self.tomorrow = days[(day + 1) % 7]
            
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
                self.today_date_parsed = today_date
                tomorrow_date = today_date + timedelta(days=1)
                self.today_date = format_date(today_date, format="short", locale=loc)
                self.tomorrow_date = format_date(tomorrow_date, format="short", locale=loc)
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
        
        await self.update_stage(3, ChatContext.empty())

    async def _llm_complete(self, system_prompt: str, chat_ctx: llm.ChatContext) -> str:
        try:
            chat_ctx.add_message(role="system", content=[system_prompt])
            llm_conn_options = APIConnectOptions(
                timeout=120.0,          # <= raise per-request limit
                max_retry=3,            # keep whatever retry policy you like
                retry_interval=2.0
            )
            stream = self._session.llm.chat(chat_ctx=chat_ctx, conn_options=llm_conn_options)
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

    async def on_user_turn_completed(
        self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
    ) -> None:
        if self.stage == 2:
            if(self.stage2_turn == 1):
                system_prompt = ONBOARDING_PROMPTS["stage2_is_user_continue"]
                await self.add_system_message(turn_ctx, system_prompt)

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
                if(self.stage == 2):
                    print("llm_node stage2")
                    if(self.stage2_turn == 0):
                        async for chunk in stream:
                            yield chunk
                        self.stage2_turn += 1
                    else:
                        response = ""
                        start_time = time.time()
                        async for chunk in stream:
                            if chunk.delta and chunk.delta.content:
                                response += chunk.delta.content
                        print("llm node stage 2 response ", response)
                        print(f"Stage 2 Stream processing took {time.time() - start_time:.2f} seconds")
                        if(response == "NO"):
                            await self.set_stage(-1)
                            system_message = ONBOARDING_PROMPTS["farewell"]
                            await self.add_system_message(chat_ctx, system_message)
                            self._session.generate_reply()
                        else:
                            print("stage 2 satisfied")
                            await self.update_stage(3, ChatContext.empty())
                            try:
                                raise StopResponse()
                            except:
                                print("Stopped Response")
                                pass
                elif(self.stage == 3):
                    print("llm_node stage3")
                    response = ""
                    start_time = time.time()
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                            if(len(response) >= 3 and (validation_signal.startswith(response) or response.upper() == validation_signal)):
                                print("stage 3 satisfied")
                                #update to stage4
                                self.stage3_chat_ctx = chat_ctx
                                await self.update_stage(4, chat_ctx)
                                raise StopResponse()
                            elif(len(response) > 100):
                                #do something
                                pass
                        yield chunk
                elif(self.stage == 4):
                    print("llm_node stage4")
                    response:str = ""
                    start_time = time.time()
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                            if(len(response) >= 3 and (validation_signal.startswith(response) or response.upper() == validation_signal)):
                                print("stage 4 satisfied")
                                await self.set_stage(5)
                                #this causes client to move out of the session page, so the participant will get disconnected
                                await self.handle_stage4(chat_ctx)   
                                raise StopResponse()
                            elif(len(response) > 100):
                                #do something
                                pass
                        yield chunk

    
    async def handle_stage4(self, chat_ctx):
        print("Time: ", self.time)
        #ToDo: even though it was 12;30 it generated plan for Today.
        if datetime.strptime(self.time, "%H:%M:%S").time() < datetime.strptime("12:00:00", "%H:%M:%S").time():
            today_plan_json = await self.get_daily_plan(self.today, chat_ctx)
            if(today_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: today_plan_response was not a valid json")
            else:
                self.today_plan_json = today_plan_json
                #save to mongo
                today_plan_json["userid"] = self.user_id
                today_plan_json["date"] = self.today_date
                today_plan_json["week_day"] = self.today
                today_plan_json["timezone"] = self.timezone
                today_plan_json["locale"] = self.locale
                today_plan_json["version"] = 0
                        # Save tomorrow_plan_json to server
                await save_to_server("dailyPlans/save", today_plan_json)

                await self._room.local_participant.send_text(
                                        topic="today_plan", 
                                        text=json.dumps(today_plan_json)
                                    )
        else:
            tomorrow_plan_json = await self.get_daily_plan(self.tomorrow, chat_ctx)
            if(tomorrow_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: today_plan_response was not a valid json")
            else:
                self.tomorrow_plan_json = tomorrow_plan_json
                tomorrow_plan_json["userid"] = self.user_id
                tomorrow_plan_json["date"] = self.tomorrow_date
                tomorrow_plan_json["week_day"] = self.tomorrow
                tomorrow_plan_json["timezone"] = self.timezone
                tomorrow_plan_json["locale"] = self.locale
                tomorrow_plan_json["version"] = 0
                # Save tomorrow_plan_json to server
                await save_to_server("dailyPlans/save", tomorrow_plan_json)
                await self._room.local_participant.send_text(
                                        topic="tomorrow_plan", 
                                        text=json.dumps(tomorrow_plan_json)
                                    )
                
    async def handle_post_stage4(self, chat_ctx):
                            #1. store stage4_output
        if(self.stage4_output_json is None):
            stage4_output_prompt = ONBOARDING_PROMPTS["stage4_output"]
            stage4_output = await self._llm_complete(stage4_output_prompt, chat_ctx)
            stage4_output_json = self._parse_json(stage4_output)
            if(stage4_output_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: Habit changes response is not a valid json")
            else:
                self.stage4_output_json = stage4_output_json
                stage4_output_json["userid"] = self.user_id
                stage4_output_json["timezone"] = self.timezone
                await save_to_server("desiredHabitChanges/save", stage4_output_json)
        if(self.habit_reformation_json is None):
                            #2. Generate Ongoing Reformation list, Save to Mongo
            habit_reformation_prompt = ONBOARDING_PROMPTS["habit_reformation_prompt"]
            habit_reformation_res = await self._llm_complete(habit_reformation_prompt, chat_ctx)
            habit_reformation_json = self._parse_json(habit_reformation_res)
            if(habit_reformation_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: Habit Reformation response is not a valid json")
            else:
                self.habit_reformation_json = habit_reformation_json
                habit_reformation_json["userid"] = self.user_id
                habit_reformation_json["timezone"] = self.timezone
                await save_to_server("ongoingChanges/save", habit_reformation_json)
        if(self.weekly_plan_json is None):
                            #3. Generate Weekly Plan, Save to Mongo
            weekly_plan_prompt = ONBOARDING_PROMPTS["weekly_plan"]
            weekly_plan_res = await self._llm_complete(weekly_plan_prompt, chat_ctx)
            weekly_plan_json = self._parse_json(weekly_plan_res)
            if(weekly_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: Weekly Plan Response is not a valid json")
            else:
                self.weekly_plan_json = weekly_plan_json
                weekly_plan_json["userid"] = self.user_id
                weekly_plan_json["timezone"] = self.timezone

                days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                day_idx = days.index(self.today)
                today_date = self.today_date_parsed
                week_start_date = today_date - timedelta(days=day_idx)
                week_start_date = format_date(week_start_date, format="short", locale=self.locale.replace("-", "_"))
                weekly_plan_json["date"] = self.today_date
                weekly_plan_json["locale"] = self.locale
                await save_to_server("weeklyRoutines/save", weekly_plan_json)

    async def get_daily_plan(self, input_day : str, chat_ctx : llm.ChatContext) -> json:
        day_plan_prompt = ONBOARDING_PROMPTS["today_plan"].format(day=input_day)
        day_plan_res = await self._llm_complete(day_plan_prompt, chat_ctx)
        print( input_day + " Plan Res Received")
        day_plan_json = self._parse_json(day_plan_res)
        return day_plan_json      

    async def set_stage(self, stage_num:int):
        self.stage = stage_num
        metadata = {"stage": str(stage_num)}
        await self._room.local_participant.set_attributes(metadata)
    
    async def add_system_message(self, chat_ctx: llm.ChatContext, message:str):
        chat_ctx.add_message(role="system", content=message)
        await self._session._agent.update_chat_ctx(chat_ctx=chat_ctx)
    
    async def update_stage(self, stage_num:int, chat_ctx: llm.ChatContext):
        print("Moving to stage ", stage_num)
        # if(stage_num == 3):
        #     self.session.say("Lets start with your current routine!")
        await self.set_stage(stage_num)
        prompt_key = "stage" + str(stage_num)
        new_prompt = ONBOARDING_PROMPTS[prompt_key]
        chat_ctx.add_message(role="system", content=new_prompt)
        await self._session._agent.update_chat_ctx(chat_ctx)
        self._session.generate_reply()

    def _store_stage3_output(self, task: asyncio.Task[str]) -> None:
        try:
            self.stage3_response_json = task.result()   # exception surfaces here
        except Exception as exc:
            print(f"Stage 3 failed: {exc}")
            return
        print("Stage 3 response ready")
        #ToDo: Also store to Mongo
    
    def set_room(self, room : Room):
        self._room = room
    def set_userid(self, userid : str):
        self.user_id = userid