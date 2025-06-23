from collections.abc import Coroutine
import json
import re
from typing import AsyncIterable, Any
from livekit.agents import llm
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.llm import ChatContext
from livekit.agents.llm.tool_context import StopResponse
from livekit.agents.voice.agent import ModelSettings
from livekit.rtc.participant import RemoteParticipant

from prompts import PROMPTS

class AssistantAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.stage = 0
        self.user_feeling = None
        self.work_routine = None
        self.daily_essentials = None

    def on_participant_connected(self, participant : RemoteParticipant):
        if participant and participant.metadata:
            print("participant metadata: ", participant.metadata)
            try:
                data = json.loads(participant.metadata)
                self.user_feeling = data.get("feeling") or "neutral"
            except Exception:
                self.user_feeling = "neutral"
        else:
            self.user_feeling = "neutral"

        self.stage = 2
        prompt = PROMPTS["app_details"].format(user_feeling=self.user_feeling)
        self._session.generate_reply(instructions=prompt, allow_interruptions=False)
    
    def on_room_connected(self):
        participant = None
        if hasattr(self._session, "_room_io") and self._session._room_io:
            participant = self._session._room_io.linked_participant

        if participant and participant.metadata:
            try:
                data = json.loads(participant.metadata)
                self.user_feeling = data.get("feeling") or "neutral"
            except Exception:
                self.user_feeling = "neutral"
        else:
            self.user_feeling = "neutral"

        self.stage = 2
        prompt = PROMPTS["app_details"].format(user_feeling=self.user_feeling)
        self._session.generate_reply(instructions=prompt, allow_interruptions=False)

    async def on_enter(self) -> None:
        participant = None
        if hasattr(self._session, "_room_io") and self._session._room_io:
            participant = self._session._room_io.linked_participant

        if participant and participant.metadata:
            try:
                data = json.loads(participant.metadata)
                self.user_feeling = data.get("feeling") or "neutral"
            except Exception:
                self.user_feeling = "neutral"
        else:
            self.user_feeling = "neutral"

        self.stage = 2
        prompt = PROMPTS["app_details"].format(user_feeling=self.user_feeling)
        self._session.generate_reply(instructions=prompt, allow_interruptions=False)

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
        if self.stage == 1:
            analysis_prompt = PROMPTS["analyze_user_feeling"]
            resp = await self._llm_complete(analysis_prompt, text)
            data = self._parse_json(resp)
            if data:
                print("llm response", data)
                self.user_feeling = data.get("feeling", {}).get("primary")
                voice_tone = "Set your voice tone to: " + data.get("voice_tone")
                if voice_tone:
                    self.update_instructions(instructions=voice_tone)
            else:
                self.user_feeling = "neutral"
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            #stage 1 to greet and anazlyze user feeling is done

            #moving to stage2
            self.stage = 2
            #first acknowlegde user's feeling and explain what this app does
            inject = PROMPTS["app_details"].format(user_feeling=self.user_feeling)
            #stop agent from replying and generate a new reply instead
            self._session.generate_reply(instructions=inject, allow_interruptions=False)
            raise StopResponse() #this stops the previous flow, where user talked about their feeling
        elif self.stage == 2:
            validation_prompt = PROMPTS["validate_if_continue"] #validate if user replied that they want to continue or not.
            resp = await self._llm_complete(validation_prompt, text)
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            answer = resp.strip().upper()
            if answer.startswith("NO"):
                self._session.say(PROMPTS["farewell"], allow_interruptions=False, add_to_chat_ctx=False)
                self.stage = -1
            else:
                self._session.generate_reply(instructions=PROMPTS["ask_work_routine"])
                #stage2 to describe about app and ask if the want to conitnue is over, starting stage 3 - work routine
                self.stage = 3 
            #stop agent from replying and generate a new reply instead
            raise StopResponse()
        elif self.stage == 3:
            # work_prompt = PROMPTS["extract_work_routine"]
            # resp = await self._llm_complete(work_prompt, text)
            # data = self._parse_json(resp)
            # if data is not None:
            #     self.work_routine = data
            # else:
            #     self.work_routine = resp.strip()
            # await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            # self._session.clear_user_turn()
            # self._session.generate_reply(instructions=PROMPTS["ask_daily_essentials"])
            # self.stage = 4
            pass;
        elif self.stage == 4:
            routine_prompt = PROMPTS["extract_daily_essentials"]
            resp = await self._llm_complete(routine_prompt, text)
            data = self._parse_json(resp)
            if data is not None:
                self.daily_essentials = data
            else:
                self.daily_essentials = resp.strip()
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            self._session.say(PROMPTS["routine_acknowledge"], allow_interruptions=False, add_to_chat_ctx=False)
            self.stage = -1

    async def transcription_node(self, text: AsyncIterable[str], model_settings: ModelSettings) -> AsyncIterable[str] | Coroutine[Any, Any, AsyncIterable[str]] | Coroutine[Any, Any, None]:
        if(self.stage == 3):
            llm_response = ""
            async for delta in text:
                llm_response += delta
            data = self._parse_json(llm_response)
            if data:
                stage = data.get("stage")
                if(stage == "SATISFIED"):
                    #extract work routine keys from JSON
                    next_prompt = PROMPTS["ask_daily_essentials"]
                    self.session.generate_reply(instructions=next_prompt)
                    self.stage = 4
                    raise StopResponse()
        elif(self.stage == 4):
            llm_response = ""
            async for delta in text:
                llm_response += delta
            data = self._parse_json(llm_response)
            if data:
                stage = data.get("stage")
                if(stage == "SATISFIED"):
                    #extract work routine keys from JSON
                    next_prompt = PROMPTS["routine_acknowledge"]
                    self.session.generate_reply(instructions=next_prompt)
                    self.stage = 5
                    raise StopResponse()
        async for delta in text:
                yield delta