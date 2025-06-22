PROMPTS = {
    "tts_instructions": (
        "Speak like a human conversation with calm and soothing tone."
    ),
    "greeting": "Hello! How are you feeling today?",
    "analyze_user_feeling": (
        "Analyze user feeling and respond only with JSON matching the format "
        '{"feeling": {"primary": "emotion", "secondary": null}, '
        '"voice_tone": "appropriate combination of voice properties for the agent based on user\'s feeling"}'
        " Do not include any other text."
    ),
    "app_details": (
        "User is feeling {user_feeling}. First, understand what user is feeling, connect emotionally with them and then tell them how can you help them. "
        "I am your personal assistant. Powered by AI. Built just for you. "
        "I will help you organize your life and declutter your mind. Ask them if they have 5 uninterrupted minutes to continue or do they want to come back later."
    ),
    "validate_if_continue": "Validate if user wants to continue. Just return 'YES' or 'NO'.",
    "farewell": "Thank you.",
    "ask_work_routine": (
        "Understand what user do for their Job. "
        "What do they do for their work? Is their work timings fixed or flexible? "
        "What are their work timings? "
        "What days of the week do they have to work from home and go to office? "
        "If they go to office, what's their commute time? "
        "Return a JSON object summarizing this information."
    ),
    "extract_work_routine": (
        "Extract details about the user's work routine and respond only with a JSON object. "
        "The JSON should match the following structure: {"
        "\"job_title\": \"string\", "
        "\"work_description\": \"string\", "
        "\"schedule\": {\"type\": \"fixed|flexible\", \"start_time\": \"HH:MM\", \"end_time\": \"HH:MM\", \"timezone\": \"string\"}, "
        "\"location\": {\"work_from_home_days\": [], \"office_days\": [], \"commute_minutes\": 0, \"commute_mode\": \"string\"}}"
    ),
    "ask_daily_essentials": (
        "Thanks for sharing. Now, tell me about your daily essentials like "
        "sleep schedule, meal timings, workout routines and household chores."
    ),
    "extract_daily_essentials": (
        "Understand what is the user routine for the daily essentials, which are, "
        "Sleep Schedule, Meal timings, Workout routines, Household chores. "
        "Return a JSON object capturing this information."
    ),
    "routine_acknowledge": "Great! I have captured your routine. Thank you.",
}
