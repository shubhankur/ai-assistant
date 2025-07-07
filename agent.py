import json
import re
from livekit.agents import llm
from livekit.agents.voice import Agent, AgentSession, ModelSettings
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.llm.tool_context import StopResponse
from livekit.rtc.participant import RemoteParticipant
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN

from prompts import PROMPTS

class AssistantAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.stage = 1
        self.user_id = None
        self.user_feeling = None
        self.work_routine = None
        self.daily_essentials = None
        self.user_json_summary = None
        self.suggest_changes_turn = 0
        self.preview_turn = 0
        self.final_routine_turn = 0

    async def on_enter(self) -> None:
        # wait for user feelings to be provided before speaking
        self.stage = 1

    async def start_with_feeling(self, feeling: str) -> None:
        self.user_feeling = feeling
        # await self.set_stage(2)
        # inject = PROMPTS["app_details"].format(user_feeling=feeling)
        # self._session.generate_reply(instructions=inject, allow_interruptions=False)
        await self.set_stage(3)
        chat_ctx = ChatContext.empty()
        chat_ctx.add_message(role="user", content=PROMPTS["stage3"])
        await self._session._agent.update_chat_ctx(chat_ctx=chat_ctx)

    async def _llm_complete(self, system_prompt: str, user_text: str) -> str:
        ctx = ChatContext.empty()
        ctx.add_message(role="system", content=[system_prompt])
        ctx.add_message(role="user", content=[user_text])
        stream = self._session.llm.chat(chat_ctx=ctx)
        parts: list[str] = []
        async for chunk in stream:
            if chunk.delta and chunk.delta.content:
                parts.append(chunk.delta.content)
        await stream.aclose()
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
        text = new_message.text_content or ""
        if self.stage == 2:
            validation_prompt = PROMPTS["validate_if_continue"] #validate if user replied that they want to continue or not.
            resp = await self._llm_complete(validation_prompt, text)
            print("llm_response", resp)
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            answer = resp.strip().upper()
            if answer.startswith("NO"):
                self._session.say(PROMPTS["farewell"], allow_interruptions=False, add_to_chat_ctx=False)
                self.stage = -1
            else:
                # await self._session.current_agent.update_chat_ctx(ChatContext.empty())
                ctx = ChatContext.empty()
                ctx.add_message(role="system", content=[PROMPTS["stage3"]])
                await self._session._agent.update_chat_ctx(ctx)
                self._session.generate_reply()
                #stage2 to describe about app and ask if the want to conitnue is over, starting stage 3 - work routine
                self.stage = 3 
            #stop agent from replying and generate a new reply instead
            raise StopResponse()
        elif self.stage == 3:
            pass
        elif self.stage == 4:
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
                if(self.stage == 3):
                    print("llm_node stage3")
                    response = ""
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            response += chunk.delta.content
                    if(response == "SATISFIED"):
                        print("llm_node stage3 satisfied")
                        await self.set_stage(4)
                        new_prompt = PROMPTS["stage4"]
                        chat_ctx.add_message(role="system", content=new_prompt)
                        await self._session._agent.update_chat_ctx(chat_ctx)
                        self._session.generate_reply()
                        raise StopResponse()
                    else:
                        yield response
                elif(self.stage == 4):
                    print("llm_node stage4")
                    suggestion_list = ""
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            suggestion_list += chunk.delta.content
                    print("llm_node stage4 response", suggestion_list)
                    suggestion_list_json = self._parse_json(suggestion_list)
                    if(suggestion_list_json.get("done")):
                        print("llm_node stage4 satisfied")
                        await self.set_stage(5)
                        new_prompt = PROMPTS["stage5"]
                        chat_ctx.add_message(role="system", content=new_prompt)
                        await self._session._agent.update_chat_ctx(chat_ctx)
                        self._session.generate_reply()
                    else:
                        #send this draft_routine to frontend
                        del suggestion_list_json["done"]
                        print("suggestion_list_json", suggestion_list_json)
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(suggestion_list_json),
                            topic="suggestion_list"
                        )
                        if(self.suggest_changes_turn == 0):
                            self._session.say(PROMPTS["stage4_turn0"])
                        elif(self.preview_turn == 1):
                            self._session.say(PROMPTS["stage4_turn1"])
                        else:
                            self.session.say(PROMPTS["stage4_turn2"])
                    self.suggest_changes_turn += 1
                    raise StopResponse()
                elif(self.stage == 5):
                    print("llm_node stage5")
                    routine_preview = ""
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            routine_preview += chunk.delta.content
                    print("llm_node stage5 response", routine_preview)
                    routine_preview_json = self._parse_json(routine_preview)
                    if(routine_preview_json.get("done")):
                        print("llm_node stage5 satisfied")
                        await self.set_stage(6)
                        new_prompt = PROMPTS["stage6"]
                        chat_ctx.add_message(role="system", content=new_prompt)
                        await self._session._agent.update_chat_ctx(chat_ctx)
                        self._session.generate_reply()
                    else:
                        #send this draft_routine to frontend
                        del routine_preview_json["done"]
                        print("routine_preview_json", routine_preview_json)
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(routine_preview_json),
                            topic="routine_preview"
                        )
                        if(self.preview_turn == 0):
                            self._session.say(PROMPTS["stage5_turn0"])
                        elif(self.preview_turn == 1):
                            self._session.say(PROMPTS["stage5_turn1"])
                        else:
                            self.session.say(PROMPTS["stage5_turn2"])
                    self.preview_turn += 1
                    raise StopResponse()
                elif(self.stage == 6):
                    print("llm_node stage6")
                    weekly_routine = ""
                    async for chunk in stream:
                        if chunk.delta and chunk.delta.content:
                            weekly_routine += chunk.delta.content
                    print("llm_node stage6 response", weekly_routine)
                    weekly_routine_json = self._parse_json(weekly_routine)
                    if(weekly_routine_json and weekly_routine_json.get("done")):
                        print("llm_node stage6 satisfied")
                        await self.set_stage(7)
                        #done
                        #we can terminate the room
                    else:
                        #send to front_end
                        del weekly_routine_json["done"]
                        print("weekly_routine_json", weekly_routine_json)
                        await self._session._room_io._room.local_participant.send_text (
                            text=json.dumps(weekly_routine_json),
                            topic="weekly_routine"
                        )
                        if(self.final_routine_turn == 0):
                            self._session.say(PROMPTS["stage6_turn0"])
                        elif(self.final_routine_turn == 1):
                            self._session.say(PROMPTS["stage6_turn1"])
                        else:
                            self.session.say(PROMPTS["stage6_turn2"])
                    self.final_routine_turn += 1
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



                    
