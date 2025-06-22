PROMPTS = {
    "greeting": "Hello! How are you feeling today?",
    "analysis_instructions": (
        "Analyze user feeling and get a json response, which should look like "
        '{"feeling": {"primary": "emotion", "secondary": null}, "voice_tone": "appropriate combination of voice properties for the agent based on user\'s feeling"}'
    ),
    "inject_help": (
        "User is feeling {user_feeling}. First, understand what user is feeling, connect emotionally with them and then tell them how can you help them. "
        "I am your personal assistant. Powered by AI. Built just for you. "
        "I will help you organize your life and declutter your mind. Ask them if they have 5 uninterrupted minutes to continue or do they want to come back later."
    ),
    "validation": "Validate if user wants to continue. Just return 'YES' or 'NO'.",
    "continue_prompt": "Great! Tell me about your work routine.",
    "farewell": "Thank you.",
    "tts_instructions": "Speak like a human conversation with calm and soothing tone.",
    "work_prompt" : "Understand what user do for their Job. "
                "What do they do for their work? Is their work timings fixed or flexible? "
                "What are their work timings? "
                "What days of the week do they have to work from home and go to office? "
                "If they go to office, what's their commute time? "
                "Return a JSON object summarizing this information.",
    "routine_prompt" : "Understand what is the user routine for the daily essenials, which are, "
                "Sleep Schedule, Meal timings, Workout routines, Household chores. "
                "Return a JSON object capturing this information."
}
