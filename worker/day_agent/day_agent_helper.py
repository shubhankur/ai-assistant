from http_utils import api_get_internal, api_post_internal
import traceback

async def get_weekly_routine(user_id: str):
    """Get the latest weekly routine for a user from the server."""
    response, data = await api_get_internal(f"weeklyRoutines/get?userId={user_id}")
    if response.status == 200 and isinstance(data, dict):
        return data
    elif response.status == 404:
        return None
    else:
        raise Exception(f"Failed to get weekly routine: HTTP {response.status}")

async def save_to_server(endpoint: str, data: dict) -> bool:
    """
    Reusable function to save data to the server via HTTP POST request.
    
    Args:
        endpoint: The API endpoint to post to (e.g., "currentRoutines", "dailyPlans")
        data: The JSON data to send
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        response, _ = await api_post_internal(endpoint, data)
        if response.status != 201:
            print(f"Error saving to {endpoint}: {response.status}")
            response_text = await response.text()
            print(f"Response: {response_text}")
            return False
        print(f"Successfully saved to {endpoint}")
        return True
    except Exception as e:
        print(f"Failed to save to {endpoint}: {str(e)}")
        traceback.print_exc()
        return False