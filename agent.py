import asyncio
import json
from livekit.agents import llm
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.llm import ChatContext

from prompts import PROMPTS

class AssistantAgent(Agent):
    def __init__(self, session: AgentSession):
        super().__init__(instructions="")
        self._session = session
        self.stage = 0
        self.user_feeling = None

    async def on_enter(self) -> None:
        handle = self._session.say(
            PROMPTS["greeting"],
            allow_interruptions=False,
            add_to_chat_ctx=False,
        )
        await handle
        self._session.clear_user_turn()
        self.stage = 1

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

    async def on_user_turn_completed(
        self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
    ) -> None:
        text = new_message.text_content or ""
        if self.stage == 1:
            analysis_prompt = PROMPTS["analysis_instructions"]
            resp = await self._llm_complete(analysis_prompt, text)
            try:
                data = json.loads(resp)
                self.user_feeling = data.get("feeling", {}).get("primary")
                voice_tone = data.get("voice_tone")
                if voice_tone:
                    self._session.tts.update_options(instructions=voice_tone)
            except json.JSONDecodeError:
                self.user_feeling = None
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            inject = PROMPTS["inject_help"].format(user_feeling=self.user_feeling)
            self._session.generate_reply(instructions=inject, allow_interruptions=False)
            self.stage = 2
        elif self.stage == 2:
            validation_prompt = PROMPTS["validation"]
            resp = await self._llm_complete(validation_prompt, text)
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            answer = resp.strip().upper()
            if answer.startswith("N"):
                self._session.say(PROMPTS["farewell"], allow_interruptions=False, add_to_chat_ctx=False)
                self.stage = -1
            else:
                self._session.generate_reply(instructions=PROMPTS["continue_prompt"])
                self.stage = 3
