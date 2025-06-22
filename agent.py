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
        self.work_routine = None
        self.daily_essentials = None

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
                print("llm response", data)
                self.user_feeling = data.get("feeling", {}).get("primary")
                voice_tone = "Set your voice tone to: " + data.get("voice_tone")
                if voice_tone:
                    self.update_instructions(instructions=voice_tone)
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
<<<<<<< HEAD
            if answer.startswith("NO"):
                self._session.say("Thank you.", allow_interruptions=False, add_to_chat_ctx=False)
=======
            if answer.startswith("N"):
                self._session.say(PROMPTS["farewell"], allow_interruptions=False, add_to_chat_ctx=False)
>>>>>>> b12740899506b4623ec0bcf6f2f88fde0720c0d2
                self.stage = -1
            else:
                self._session.generate_reply(instructions=PROMPTS["continue_prompt"])
                self.stage = 3
        elif self.stage == 3:
            work_prompt = (
                "Understand what user do for their Job. "
                "What do they do for their work? Is their work timings fixed or flexible? "
                "What are their work timings? "
                "What days of the week do they have to work from home and go to office? "
                "If they go to office, what's their commute time? "
                "Return a JSON object summarizing this information."
            )
            resp = await self._llm_complete(work_prompt, text)
            try:
                self.work_routine = json.loads(resp)
            except json.JSONDecodeError:
                self.work_routine = resp.strip()
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            self._session.generate_reply(
                instructions=(
                    "Thanks for sharing. Now, tell me about your daily essentials like "
                    "sleep schedule, meal timings, workout routines and household chores."
                )
            )
            self.stage = 4
        elif self.stage == 4:
            routine_prompt = (
                "Understand what is the user routine for the daily essenials, which are, "
                "Sleep Schedule, Meal timings, Workout routines, Household chores. "
                "Return a JSON object capturing this information."
            )
            resp = await self._llm_complete(routine_prompt, text)
            try:
                self.daily_essentials = json.loads(resp)
            except json.JSONDecodeError:
                self.daily_essentials = resp.strip()
            await self._session.current_agent.update_chat_ctx(ChatContext.empty())
            self._session.clear_user_turn()
            self._session.say("Great! I have captured your routine. Thank you.", allow_interruptions=False, add_to_chat_ctx=False)
            self.stage = -1
