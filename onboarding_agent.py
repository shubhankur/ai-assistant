import json
import re
import time
import asyncio
from livekit.agents import llm
from livekit.agents.voice import Agent, AgentSession, ModelSettings
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.llm.tool_context import StopResponse
from livekit.rtc.participant import RemoteParticipant, Participant
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN

from prompts import PROMPTS

class OnboardingAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.stage = 1
        self.user_id = None
        self.user_feeling = None
        self.stage3_response = None
        self.stage4_response = None
        self.stage5_response = None
        self.stage6_response = None
        self.stage2_turn = 0
        self.stage4_turn = 0
        self.stage5_turn = 0
        self.stage6_turn = 0

    
    async def on_participant_attribute_changed(self, attributes : dict, participant : Participant) -> None:
        received_stage = attributes.get("stage")
        if(received_stage):
            stage = int(received_stage)
            if(stage == 3):
                await self.update_stage(3, ChatContext.empty())
                raise StopResponse()
            elif(stage == 7):
                #ToDo: Maybe store the obtained information till now
                await self.update_stage(7, ChatContext.empty())
                raise StopResponse()


    async def start_with_feeling(self, feeling: str) -> None:
        self.user_feeling = feeling
        await self.set_stage(2)
        new_prompt = PROMPTS["stage2"].format(user_feeling=feeling)
        self._session.generate_reply(instructions=new_prompt, allow_interruptions=False)
        #user responds if they want to continue

        # When testing start directly at the end of stage 3 
        # await self.set_stage(3)
        # new_prompt = PROMPTS["stage3_filled"]
        # await self.add_system_message(ChatContext.empty(), new_prompt)

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
            system_prompt = PROMPTS["stage2_is_user_continue"]
            await self.add_system_message(turn_ctx, system_prompt)
            self.stage2_turn += 1
        elif self.stage == 3:
            pass
        elif self.stage == 4:
            if self.stage4_turn > 1:
                # user has seen stage4 response and has provided their requested change once, 
                # we will capture their request but do not need to regenerate the response.
                #Verify if user's final changes were captured.
                await self.update_stage(5, turn_ctx)
                raise StopResponse()
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
                            system_message = PROMPTS["farewell"]
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
                            #update to stage4
                            await self.update_stage(4, chat_ctx)
                            raise StopResponse()
                        #ToDo: Some Validation that model did not mess up for example, very long response.
                        else:
                            if(response):
                                print(f"Stage 3 Stream processing took {time.time() - start_time:.2f} seconds")
                                response += chunk.delta.content
                                yield response
                                response = None
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
                            #update to stage4
                            await self.update_stage(5, chat_ctx)
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
                elif(self.stage == 5):
                    print("llm_node stage5")
                    suggestion_list = ""
                    start_time = time.time()
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            suggestion_list += chunk.delta.content
                    print(f"Stage 5 Stream processing took {time.time() - start_time:.2f} seconds")
                    suggestion_list_json = self._parse_json(suggestion_list)
                    if(suggestion_list_json is None):
                        #ToDo: Think what can we do here.
                        print("Error: llm did not return the JSON")
                        #for now, we will move to the next stage
                        await self.update_stage(6, chat_ctx)
                    else:
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(suggestion_list_json),
                            topic="suggestion_list"
                        )
                        self._session.say(PROMPTS["stage5_turn"+ str(self.stage5_turn)])
                    self.stage5_turn += 1 
                    raise StopResponse()
                    print("llm_node stage5")
                    routine_preview = ""
                    start_time = time.time()
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            routine_preview += chunk.delta.content
                    print(f"Stage 5 Stream processing took {time.time() - start_time:.2f} seconds")
                    if(routine_preview.upper() == "SATISFIED"):
                        print("llm_node stage5 satisfied")
                        await self.set_stage(6)
                        new_prompt = PROMPTS["stage6"]
                        chat_ctx.add_message(role="system", content=new_prompt)
                        await self._session._agent.update_chat_ctx(chat_ctx)
                        self._session.generate_reply()
                    else:
                        #send this draft_routine to frontend
                        routine_preview_json = self._parse_json(routine_preview)
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(routine_preview_json),
                            topic="routine_preview"
                        )
                        if(self.stage5_turn == 0):
                            self._session.say(PROMPTS["stage5_turn0"])
                        elif(self.stage5_turn == 1):
                            self._session.say(PROMPTS["stage5_turn1"])
                        else:
                            self.session.say(PROMPTS["stage5_turn2"])
                    self.stage5_turn += 1
                    raise StopResponse()
                elif(self.stage == 6):
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
                        self._session.say(PROMPTS["stage5_turn"+ str(self.stage5_turn)])
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
        await self._session._room_io._room.local_participant.set_attributes(metadata)
    
    async def add_system_message(self, chat_ctx: llm.ChatContext, message:str):
        chat_ctx.add_message(role="system", content=message)
        await self._session._agent.update_chat_ctx(chat_ctx=chat_ctx)
    
    async def update_stage(self, stage_num:int, chat_ctx: llm.ChatContext):
        print("Moving to stage ", stage_num)
        await self.set_stage(stage_num)
        prompt_key = "stage" + str(stage_num)
        new_prompt = PROMPTS[prompt_key]
        chat_ctx.add_message(role="system", content=new_prompt)
        await self._session._agent.update_chat_ctx(chat_ctx)
        self._session.generate_reply()

    def _store_stage3_output(self, task: asyncio.Task[str]) -> None:
        self.stage3_response = task.result()



                    
