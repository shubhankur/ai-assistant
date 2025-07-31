# AI Assistant

This project contains a minimal example of a voice assistant built using the LiveKit agents framework. The assistant greets the user, analyzes their mood and collects details about their daily routines.

## Features

1. **Emotion detection** – The agent analyzes the user's initial response to adjust its voice tone.
2. **Work routine capture** – The user is asked about their job and work schedule.
3. **Daily essentials capture** – The assistant gathers information about sleep, meals, workouts and chores.

## Date Format Flow

The application handles dates across three components with specific format requirements:

1. **Client → Worker**: The client sends dates using `toLocaleDateString()` format (e.g., "7/31/2025")
2. **Worker Processing**: The worker converts dates to ISO format (`yyyy-MM-dd`) using Babel's `format_date()` function
3. **Server Storage**: Dates are stored in the database in ISO format (`yyyy-MM-dd`)
4. **Client Fetching**: When the client fetches dates from the server, it needs to parse the ISO format accordingly

**Important**: When parsing ISO dates on the client side, be aware of timezone conversion issues. Use `new Date(isoDate + 'T00:00:00')` to ensure the date is interpreted in local timezone rather than UTC.

The entry point is `main.py` which sets up the session and starts the `AssistantAgent`.
