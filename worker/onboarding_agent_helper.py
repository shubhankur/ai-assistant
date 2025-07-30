from http_utils import api_post_internal
import traceback



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