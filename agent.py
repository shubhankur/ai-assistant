import json
import re
from livekit.agents import llm
from livekit.agents.voice import Agent, AgentSession, ModelSettings
from livekit.agents.llm import ChatContext, FunctionTool, RawFunctionTool
from livekit.agents.llm.tool_context import StopResponse
from collections.abc import AsyncGenerator
from livekit.agents.types import NOT_GIVEN

from prompts import PROMPTS

class AssistantAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.stage = 1
        self.user_feeling = None
        self.work_routine = None
        self.daily_essentials = None
        self.user_json_summary = None

    async def on_enter(self) -> None:
        # wait for user feelings to be provided before speaking
        self.stage = 1

    def start_with_feeling(self, feeling: str) -> None:
        self.user_feeling = feeling
        self.stage = 2
        inject = PROMPTS["app_details"].format(user_feeling=feeling)
        self._session.generate_reply(instructions=inject, allow_interruptions=False)

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
                await self._session.current_agent.update_chat_ctx(ChatContext.empty())
                self._session.generate_reply(instructions=PROMPTS["draft_routine"])
                #stage2 to describe about app and ask if the want to conitnue is over, starting stage 3 - work routine
                self.stage = 3 
            #stop agent from replying and generate a new reply instead
            raise StopResponse()
        elif self.stage == 3:
            pass
        elif self.stage == 4:
            pass

    async def llm_node(
            agent: Agent,
            chat_ctx: llm.ChatContext,
            tools: list[FunctionTool | RawFunctionTool],
            model_settings: ModelSettings,
        ) -> AsyncGenerator[llm.ChatChunk | str, None]:
            """Default implementation for `Agent.llm_node`"""
            activity = agent._get_activity_or_raise()
            assert activity.llm is not None, "llm_node called but no LLM node is available"
            assert isinstance(activity.llm, llm.LLM), (
                "llm_node should only be used with LLM (non-multimodal/realtime APIs) nodes"
            )
            print("in LLM node")
            tool_choice = model_settings.tool_choice if model_settings else NOT_GIVEN
            activity_llm = activity.llm

            conn_options = activity.session.conn_options.llm_conn_options
            async with activity_llm.chat(
                chat_ctx=chat_ctx, tools=tools, tool_choice=tool_choice, conn_options=conn_options
            ) as stream:
                if(agent.stage == 3):
                    print("llm_node stage3")
                    messages = ""
                    for message in chat_ctx.items:
                        messages += message.text_content + "\n"
                    print("Chat context messages:", messages)
                    first_chunk = None
                    satisfied = False
                    async for chunk in stream:
                        if(first_chunk is None):
                            first_chunk = chunk
                            if(first_chunk == "SATISFIED"):
                                print("llm_node stage3 satisfied")
                                satisfied = True
                                break
                        yield chunk
                    if(satisfied):
                        agent.stage = 4
                        new_prompt = PROMPTS["generate_preview_draft"]
                        await agent._session.generate_reply(instructions=new_prompt)
                        raise StopResponse() 
                elif(agent.stage == 4):
                    print("llm_node stage4")
                    draft_routine = ""
                    async for chunk in stream:
                        draft_routine += chunk
                    print("llm_node stage4 response", draft_routine)
                    if(draft_routine == "SATISFIED"):
                        print("llm_node stage4 satisfied")
                        agent.stage = 5
                        new_prompt = PROMPTS["final_routine_draft"]
                        await agent._session.generate_reply(instructions=new_prompt)
                    else:
                        #send this draft_routine to frontend
                        pass
                    raise StopResponse()
                elif(agent.stage == 5):
                    print("llm_node stage5")
                    weekly_routine_json = ""
                    async for chunk in stream:
                        weekly_routine_json += chunk
                    print("llm_node stage5 response", weekly_routine_json)
                    parsed_json = agent._parse_json(weekly_routine_json)
                    if(parsed_json and parsed_json.get("SATISFIED")):
                        print("llm_node stage5 satisfied")
                        agent.stage = 6
                    #send to front_end
                    raise StopResponse()
                else:
                    async for chunk in stream:
                        yield chunk




                    
