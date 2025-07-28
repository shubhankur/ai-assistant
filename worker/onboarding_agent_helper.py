import tiktoken
import aiohttp
import os
import re
import traceback
from livekit.agents import llm
from typing import Optional

server_url = os.getenv('SERVER_URL')


async def save_to_server(endpoint: str, data: dict) -> bool:
    """
    Reusable function to save data to the server via HTTP POST request.
    
    Args:
        endpoint: The API endpoint to post to (e.g., "currentRoutines", "dailyPlans")
        data: The JSON data to send
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not server_url:
        print("Error: SERVER_URL environment variable is not set")
        return False
        
    async with aiohttp.ClientSession() as session:
        try:
            url = f"{server_url}/{endpoint}"
            print(f"Attempting to save to: {url}")
            async with session.post(url, json=data) as response:
                if response.status != 201:
                    print(f"Error saving to {endpoint}: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")
                    return False
                else:
                    print(f"Successfully saved to {endpoint}")
                    return True
        except Exception as e:
            print(f"Failed to save to {endpoint}: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            print(f"Full exception details:")
            traceback.print_exc()
            return False