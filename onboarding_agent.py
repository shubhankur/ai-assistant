import json
import re
import time
import asyncio
from livekit.agents import llm, Agent, AgentSession, ModelSettings
# from livekit.agents.voice import Agent, AgentSession, ModelSettings
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.llm.tool_context import StopResponse
from livekit.rtc.participant import RemoteParticipant, Participant
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN

from onboarding_prompts import ONBOARDING_PROMPTS

class OnboardingAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self._room = session._room_io._room
        self.stage = 1
        self.user_id = None
        self.user_feeling = None
        self.stage3_task = None
        self.stage3_response = None
        self.stage4_task = None
        self.stage4_response = None
        self.habit_reformation_task = None
        self.habit_reformation_list = None
        self.weekly_routine_task = None
        self.weekly_routine = None
        self.stage2_turn = 0
        self.today = ""
        self.today_task = None
        self.today_plan = None

    
    async def on_participant_attribute_changed(self, attributes : dict, participant : Participant) -> None:
        received_stage = attributes.get("stage")
        if(received_stage):
            stage = int(received_stage)
            if(stage == 3):
                await self.update_stage(3, ChatContext.empty())
                raise StopResponse()
            elif(stage == 7):
                #ToDo: If the user has skipped. Maybe store the obtained information till now
                await self.update_stage(7, ChatContext.empty())
                raise StopResponse()

    async def start(self, feeling: str, day: str) -> None:
        self.user_feeling = feeling
        self.today = day
        await self.set_stage(2)
        new_prompt = ONBOARDING_PROMPTS["stage2"].format(user_feeling=feeling)
        self._session.generate_reply(instructions=new_prompt, allow_interruptions=False)
        #user responds if they want to continue

    async def _llm_complete(self, system_prompt: str, chat_ctx: llm.ChatContext) -> str:
        chat_ctx.add_message(role="system", content=[system_prompt])
        stream = self._session.llm.chat(chat_ctx=chat_ctx)
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
            system_prompt = ONBOARDING_PROMPTS["stage2_is_user_continue"]
            await self.add_system_message(turn_ctx, system_prompt)
            self.stage2_turn += 1
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
                    else:
                        response = ""
                        async for chunk in stream:
                            if chunk.delta and chunk.delta.content:
                                response += chunk.delta.content
                        print("llm node stage 2 response")
                        if(response == "NO"):
                            await self.set_stage(-1)
                            system_message = ONBOARDING_PROMPTS["farewell"]
                            await self.add_system_message(chat_ctx, system_message)
                            self._session.generate_reply()
                        else:
                            await self.update_stage(3, ChatContext.empty())
                            raise StopResponse()
                elif(self.stage == 3):
                    print("llm_node stage3")
                    response = ""
                    start_time = time.time()
                    iter = 0
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content and iter < len(validation_signal):
                            response += chunk.delta.content
                            iter += 1
                        elif(response.upper() == validation_signal):
                            #store output
                            prompt = ONBOARDING_PROMPTS["stage3_output"]
                            self.stage3_task = asyncio.create_task(
                                self._llm_complete(prompt, chat_ctx)
                            )
                            self.stage3_task.add_done_callback(self._store_stage3_output)
                            #update to stage4
                            await self.update_stage(4, chat_ctx)
                            raise StopResponse()
                        #ToDo: Some Validation that model did not mess up for example, very long response.
                        else:
                            if(response):
                                print(f"Stage 3 Stream processing took {time.time() - start_time:.2f} seconds")
                                response += chunk.delta.content
                                yield response
                                response = None #ToDo; Validate if it works
                            else:
                                yield chunk
                elif(self.stage == 4):
                    print("llm_node stage4")
                    response = ""
                    start_time = time.time()
                    iter = 0
                    validation_signal = "SATISFIED"
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content and iter < len(validation_signal):
                            response += chunk.delta.content
                            iter += 1
                        elif(response.upper() == validation_signal):
                            await self.set_stage(5)
                            #1. Async Generate plan for today, Save to Mongo               
                            today_plan_prompt = ONBOARDING_PROMPTS["today_plan"]
                            self.today_task = asyncio.create_task(
                                self._llm_complete(today_plan_prompt, chat_ctx)
                            )
                            self.today_task.add_done_callback(self._store_today_plan)
                            
                            #2. Async store stage4_output
                            stage4_output_prompt = ONBOARDING_PROMPTS["stage4_output"]
                            self.stage4_task = asyncio.create_task(
                                self._llm_complete(stage4_output_prompt, chat_ctx)
                            )
                            self.stage4_task.add_done_callback(self._store_stage4_output)
                            #3. Async Generate Ongoing Reformation list, Save to Mongo
                            #4. Async Generate Weekly Plan, Save to Mongo
                            pass
                        #ToDo: Some Validation that model did not mess up for example, very long response.
                        else:
                            if(response):
                                print(f"Stage 4 Stream processing took {time.time() - start_time:.2f} seconds")
                                response += chunk.delta.content
                                yield response
                                response = None #ToDo; Validate if it works
                            else:
                                yield chunk       
                # elif(self.stage == 5):
                #     print("llm_node stage5")
                #     suggestion_list = ""
                #     start_time = time.time()
                #     async for chunk in stream:
                #         if chunk.delta and chunk.delta.content:
                #             suggestion_list += chunk.delta.content
                #     print(f"Stage 5 Stream processing took {time.time() - start_time:.2f} seconds")
                #     suggestion_list_json = self._parse_json(suggestion_list)
                #     if(suggestion_list_json is None):
                #         #ToDo: Think what can we do here.
                #         print("Error: llm did not return the JSON")
                #         #for now, we will move to the next stage
                #         await self.update_stage(6, chat_ctx)
                #     else:
                #         await self._session._room_io._room.local_participant.send_text (
                #             text=json.dumps(suggestion_list_json),
                #             topic="suggestion_list"
                #         )
                #         self._session.say(PROMPTS["stage5_turn"+ str(self.stage5_turn)])
                #     self.stage5_turn += 1 
                #     raise StopResponse()
                # elif(self.stage == 6):
                    print("llm_node stage6")
                    weekly_routine = ""
                    start_time = time.time()
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            weekly_routine += chunk.delta.content
                    print(f"Stage 6 Stream processing took {time.time() - start_time:.2f} seconds")
                    weekly_routine_json = self._parse_json(weekly_routine)
                    if (weekly_routine_json is None):
                        #ToDo: Think what can we do here.
                        print("Error: llm did not return the JSON")
                        #for now, we will move to the next stage
                        await self.update_stage(6, chat_ctx)
                    else:
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(weekly_routine_json),
                            topic="weekly_routine"
                        )
                        self._session.say(ONBOARDING_PROMPTS["stage5_turn"+ str(self.stage5_turn)])
                        #ToDo: in frontend there will be user button to ask if they liked the routine.
                        #based on that button we will: 1. regenerate json based on user's new requirement or move to stage 7
                    self.stage6_turn += 1
                    raise StopResponse()
                else:
                    async for chunk in stream:
                        yield chunk
    
    def set_user_id(self, id:str):
        self.user_id = id
    
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
        setattr()
        await self._session._agent.update_chat_ctx(chat_ctx)
        self._session.generate_reply()

    def _store_stage3_output(self, task: asyncio.Task[str]) -> None:
        self.stage3_response = task.result()
    
    def _store_stage4_output(self, task: asyncio.Task[str]) -> None:
        self.stage4_response = task.result()

    def _store_today_plan(self, task: asyncio.Task[str]) -> None:
        self.today_plan = task.result()



                    
