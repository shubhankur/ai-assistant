import json
import re
import time
import tiktoken
from livekit.plugins.openai import llm
from typing import Optional
import asyncio
from livekit.agents import llm, Agent, AgentSession, ModelSettings
from livekit.rtc import Room, DisconnectReason
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.types import APIConnectOptions
from livekit.agents.llm.tool_context import StopResponse
from livekit.rtc.participant import Participant
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN
from datetime import datetime

from onboarding_prompts import ONBOARDING_PROMPTS

def parse_js_date_string(date_str):
    # Example: "Fri Jul 25 2025 00:57:54 GMT-0400 (Eastern Daylight Time)"
    match = re.match(
        r"(\w{3}) (\w{3} \d{2} \d{4}) (\d{2}:\d{2}:\d{2}) (GMT[+-]\d{4})",
        date_str
    )
    if match:
        day, date, time, gmt = match.groups()
        timezone = gmt  # Only GMT value
        return day, date, time, timezone
    else:
        return None, None, None, None

def count_total_tokens_from_chat_ctx(
    chat_ctx: llm.ChatContext,
    prompt: Optional[str] = None,
    model: str = "gpt-3.5-turbo"
) -> int:
    """
    Count total tokens used by ChatCtx history + optional new prompt.

    Args:
        chat_ctx: LiveKit llm.ChatCtx object containing chat history
        prompt: Optional new prompt string to include in the count
        model: OpenAI model name for token encoding (default: gpt-3.5-turbo)

    Returns:
        int: Total number of tokens
    """
    try:
        enc = tiktoken.encoding_for_model(model)

        total_tokens = 0
        for message in chat_ctx.to_provider_format(format="openai"):
            total_tokens += 4  # message overhead
            total_tokens += len(enc.encode(message.get("content", "")))

        if prompt:
            total_tokens += 4  # new prompt message overhead
            total_tokens += len(enc.encode(prompt))

        total_tokens += 1  # assistant reply primer token
        return total_tokens
    except Exception as e:
        print("Error counting tokens ", e.__cause__)
        return 0

class OnboardingAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self._room = None
        self.stage = 1
        self.user_feeling = None
        self.stage3_task = None
        self.stage3_response = None
        self.stage2_turn = 0
        self.today = ""
        self.tomorrow = ""
        self.date = ""
        self.time = ""
        self.timezone = ""
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
    
    async def on_room_disconnected(self, reason: DisconnectReason):
        print("WARN: Room Disconnected ", reason)
        chat_ctx = self.chat_ctx
        if(self.stage == 4 or self.stage == 5):
            if(self.today_plan_json is None):
                today_plan_json = await self.get_daily_plan(self.today, chat_ctx)
                if(today_plan_json is None):
                                        #ToDo: Maybe ask to regenerate
                    print("Error: today_plan_response was not a valid json")
                else:
                                    #Save to Mongo
                    pass
            if(self.tomorrow_plan_json is None):
                tomorrow_plan_json = await self.get_daily_plan(self.today, chat_ctx)
                if(tomorrow_plan_json is None):
                                        #ToDo: Maybe ask to regenerate
                    print("Error: tomorrow_plan_response was not a valid json")
                else:
                                    #Save to Mongo
                    self.tomorrow_plan_json = tomorrow_plan_json
                    pass
            await self.handle_post_stage4()
            await self._room.disconnect()

    
    async def start(self, feeling: str, date: str) -> None:
        self.user_feeling = feeling
        # Parse date string (Fri Jul 25 2025 00:57:54 GMT-0400 (Eastern Daylight Time)) into day, date, time and timezone
        day, date_str, time, timezone = parse_js_date_string(date)
        self.today = day
        self.date = date_str
        self.time = time
        self.timezone = timezone
        # Calculate tomorrow's day using only the day string
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        if day in days:
            idx = days.index(day)
            self.tomorrow = days[(idx + 1) % 7]
        else:
            self.tomorrow = ""
        await self.set_stage(2)
        new_prompt = ONBOARDING_PROMPTS["stage2"].format(user_feeling=feeling)
        self.greeting_speech = self._session.generate_reply(instructions=new_prompt, allow_interruptions=True)
        #user responds if they want to continue

    async def _llm_complete(self, system_prompt: str, chat_ctx: llm.ChatContext) -> str:
        token_count = count_total_tokens_from_chat_ctx(chat_ctx, system_prompt)
        if(token_count > 2000):
            print("WARNING: TOKEN COUNT greater than 2000! Cannot process further.")
            return ""
        else:
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
        elif self.stage == 3:
            pass
        elif self.stage == 4:
            pass
        elif self.stage == 5:
            pass
        elif self.stage == 6:
            pass

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
                        yield chunk
                        if(response.upper() == validation_signal):
                            print("stage 3 satisfied")

                            #store output
                            prompt = ONBOARDING_PROMPTS["stage3_output"]
                            self.stage3_task = asyncio.create_task(
                                self._llm_complete(prompt, chat_ctx)
                            )
                            self.stage3_task.add_done_callback(self._store_stage3_output)

                            #update to stage4
                            await self.update_stage(4, chat_ctx)
                            raise StopResponse()
                        elif(len(response) > 100):
                            #do something
                            pass
                elif(self.stage == 4):
                    print("llm_node stage4")
                    response:str = ""
                    start_time = time.time()
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if(chunk.delta and chunk.delta.content):
                            response += chunk.delta.content
                        yield chunk
                        if(response.upper() == validation_signal):
                            print("stage 4 satisfied")
                            #1. Generate plan for today or tomorrow, Send to Client And Save to Mongo      
                            await self.handle_stage4(chat_ctx) #this causes client to move out of the session page, so room will get disconnected   
                            await self.set_stage(5)
                            await self._room.disconnect()
                            raise StopResponse()
                        elif(len(response) > 100):
                            #do something
                            pass

    
    async def handle_stage4(self, chat_ctx):
        if datetime.strptime(self.time, "%H:%M:%S").time() < datetime.strptime("12:00:00", "%H:%M:%S").time():
            today_plan_json = await self.get_daily_plan(self.today, chat_ctx)
            if(today_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: today_plan_response was not a valid json")
            else:
                self.today_plan_json = today_plan_json
                await self._room.local_participant.send_text(
                                        topic="today_plan", 
                                        text=json.dumps(today_plan_json)
                                    )
                                    #Save to Mongo
        else:
            tomorrow_plan_json = await self.get_daily_plan(self.tomorrow, chat_ctx)
            if(tomorrow_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: today_plan_response was not a valid json")
            else:
                self.tomorrow_plan_json = tomorrow_plan_json
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
                                    #mongo store
                pass
        if(self.habit_reformation_json is None):
                            #2. Async Generate Ongoing Reformation list, Save to Mongo
            habit_reformation_prompt = ONBOARDING_PROMPTS["habit_reformation_prompt"]
            habit_reformation_res = await self._llm_complete(habit_reformation_prompt, chat_ctx)
            habit_reformation_json = self._parse_json(habit_reformation_res)
            if(habit_reformation_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: Habit Reformation response is not a valid json")
            else:
                self.habit_reformation_json = habit_reformation_json
                                    #mongo store
                pass

        if(self.weekly_plan_json is None):
                            #3. Async Generate Weekly Plan, Save to Mongo
            weekly_plan_prompt = ONBOARDING_PROMPTS["weekly_plan"]
            weekly_plan_res = await self._llm_complete(weekly_plan_prompt, chat_ctx)
            weekly_plan_json = self._parse_json(weekly_plan_res)
            if(weekly_plan_json is None):
                                    #ToDo: Maybe ask to regenerate
                print("Error: Weekly Plan Response is not a valid json")
            else:
                self.weekly_plan_json = weekly_plan_json
                                    #mongo store
                pass
    
    async def get_daily_plan(self, input_day : str, chat_ctx : llm.ChatContext) -> json:
        day_plan_prompt = ONBOARDING_PROMPTS["today_plan"].format(day=input_day)
        day_plan_res = await self._llm_complete(day_plan_prompt, chat_ctx)
        print("Today Plan Res ", day_plan_res)
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
        await self.set_stage(stage_num)
        prompt_key = "stage" + str(stage_num)
        new_prompt = ONBOARDING_PROMPTS[prompt_key]
        chat_ctx.add_message(role="system", content=new_prompt)
        await self._session._agent.update_chat_ctx(chat_ctx)
        self._session.generate_reply()

    def _store_stage3_output(self, task: asyncio.Task[str]) -> None:
        try:
            self.stage3_response = task.result()   # exception surfaces here
        except Exception as exc:
            print(f"Stage 3 failed: {exc}")
            return
        print("Stage 3 response ready")
        #ToDo: Also store to Mongo
    
    def set_room(self, room : Room):
        self._room = room