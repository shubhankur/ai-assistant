import aiohttp
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime


async def post_to_api(url: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Send a POST request to the specified URL with the given data.
    
    Args:
        url (str): The URL to send the POST request to
        data (Dict[str, Any]): The data to send in the request body
        
    Returns:
        Optional[Dict[str, Any]]: The response data if successful, None if failed
    """
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=data) as response:
                if response.status != 201:
                    print(f"Error saving data: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")
                    return None
                else:
                    print("Data saved successfully to DB")
                    try:
                        return await response.json()
                    except:
                        return {"status": "success", "message": "Data saved successfully"}
        except Exception as e:
            print(f"Failed to save data: {str(e)}")
            return None


async def create_user(server_url: str, user_data: Dict[str, Any]) -> Optional[str]:
    """
    Create a user in the database and return the ObjectId.
    
    Args:
        server_url (str): Base server URL
        user_data (Dict[str, Any]): User data to create
        
    Returns:
        Optional[str]: The ObjectId of the created user if successful, None if failed
    """
    url = f"{server_url}/users"
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=user_data) as response:
                if response.status != 201:
                    print(f"Error creating user: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")
                    return None
                else:
                    print("User created successfully")
                    try:
                        user_response = await response.json()
                        return user_response.get('_id')  # Return the ObjectId
                    except:
                        print("Failed to parse user response")
                        return None
        except Exception as e:
            print(f"Failed to create user: {str(e)}")
            return None


async def store_stage3_response_json(user_id: str, timezone: str, stage3_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store stage3_response_json (current routine) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        stage3_data (Dict[str, Any]): The stage3 response data containing weekly routine
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Prepare data according to CurrentRoutine schema
    current_routine_data = {
        "userid": user_id,
        "timezone": timezone,
        "Monday": stage3_data.get("Monday", []),
        "Tuesday": stage3_data.get("Tuesday", []),
        "Wednesday": stage3_data.get("Wednesday", []),
        "Thursday": stage3_data.get("Thursday", []),
        "Friday": stage3_data.get("Friday", []),
        "Saturday": stage3_data.get("Saturday", []),
        "Sunday": stage3_data.get("Sunday", [])
    }
    
    url = f"{server_url}/currentRoutines"
    return await post_to_api(url, current_routine_data)


async def store_stage4_output_json(user_id: str, timezone: str, stage4_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store stage4_output_json (user desired habit changes) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        stage4_data (Dict[str, Any]): The stage4 output data containing aspirations
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Prepare data according to UserDesiredHabitChanges schema
    habit_changes_data = {
        "userid": user_id,
        "timezone": timezone,
        "goals": stage4_data.get("aspirations", {}).get("goals", []),
        "lifestyle_changes": stage4_data.get("aspirations", {}).get("lifestyle_changes", []),
        "activities_to_add": stage4_data.get("aspirations", {}).get("activities_to_add", []),
        "activities_to_remove": stage4_data.get("aspirations", {}).get("activities_to_remove", [])
    }
    
    url = f"{server_url}/desiredHabitChanges"
    return await post_to_api(url, habit_changes_data)


async def store_today_plan_json(user_id: str, timezone: str, today_plan_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store today_plan_json (daily plan) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        today_plan_data (Dict[str, Any]): The today plan data containing blocks
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Prepare data according to DailyPlan schema
    daily_plan_data = {
        "userid": user_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "week_day": datetime.now().strftime("%A"),
        "timezone": timezone,
        "version": 1,
        "blocks": today_plan_data.get("blocks", [])
    }
    
    url = f"{server_url}/dailyPlans"
    return await post_to_api(url, daily_plan_data)


async def store_tomorrow_plan_json(user_id: str, timezone: str, tomorrow_plan_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store tomorrow_plan_json (daily plan) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        tomorrow_plan_data (Dict[str, Any]): The tomorrow plan data containing blocks
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Calculate tomorrow's date
    tomorrow = datetime.now()
    tomorrow = tomorrow.replace(day=tomorrow.day + 1)
    
    # Prepare data according to DailyPlan schema
    daily_plan_data = {
        "userid": user_id,
        "date": tomorrow.strftime("%Y-%m-%d"),
        "week_day": tomorrow.strftime("%A"),
        "timezone": timezone,
        "version": 1,
        "blocks": tomorrow_plan_data.get("blocks", [])
    }
    
    url = f"{server_url}/dailyPlans"
    return await post_to_api(url, daily_plan_data)


async def store_habit_reformation_json(user_id: str, timezone: str, habit_reformation_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store habit_reformation_json (user ongoing changes) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        habit_reformation_data (Dict[str, Any]): The habit reformation data containing suggestions
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Prepare data according to UserOngoingChanges schema
    # Map priority levels from the data to the schema
    ongoing_changes_data = {
        "userid": user_id,
        "timezone": timezone,
        "HIGH_PRIORITY": habit_reformation_data.get("HIGHEST", []) + habit_reformation_data.get("HIGH", []),
        "MEDIUM_PRIORITY": habit_reformation_data.get("MEDIUM", []),
        "LOW_PRIORITY": habit_reformation_data.get("LOW", []) + habit_reformation_data.get("LEAST", [])
    }
    
    url = f"{server_url}/ongoingChanges"
    return await post_to_api(url, ongoing_changes_data)


async def store_weekly_plan_json(user_id: str, timezone: str, weekly_plan_data: Dict[str, Any], server_url: str) -> Optional[Dict[str, Any]]:
    """
    Store weekly_plan_json (weekly routine) to the database.
    
    Args:
        user_id (str): User ID
        timezone (str): User's timezone
        weekly_plan_data (Dict[str, Any]): The weekly plan data containing weekly schedule
        server_url (str): Base server URL
        
    Returns:
        Optional[Dict[str, Any]]: Response from server if successful, None if failed
    """
    # Prepare data according to WeeklyRoutine schema
    weekly_routine_data = {
        "userid": user_id,
        "timezone": timezone,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "Monday": weekly_plan_data.get("Monday", []),
        "Tuesday": weekly_plan_data.get("Tuesday", []),
        "Wednesday": weekly_plan_data.get("Wednesday", []),
        "Thursday": weekly_plan_data.get("Thursday", []),
        "Friday": weekly_plan_data.get("Friday", []),
        "Saturday": weekly_plan_data.get("Saturday", []),
        "Sunday": weekly_plan_data.get("Sunday", [])
    }
    
    url = f"{server_url}/weeklyRoutines"
    return await post_to_api(url, weekly_routine_data)


# Example usage and test function
async def test_all_functions():
    """Test function to demonstrate usage of all storage functions"""
    server_url = "http://localhost:5005"
    timezone = "GMT-0400"
    
    # First, create a test user
    user_data = {
        "name": "Test User",
        "age": 30,
        "email": "testuser@example.com",
        "phone": "123-456-7890",
        "address": "123 Test St",
        "occupation": "Software Developer"
    }
    
    print("Creating test user...")
    user_id = await create_user(server_url, user_data)
    
    if not user_id:
        print("Failed to create user. Cannot proceed with tests.")
        return
    
    print(f"Created user with ID: {user_id}")
    
    # Sample stage3 data (current routine)
    stage3_sample = {
        "Monday": [
            {
                "activity": "Work",
                "start": "09:00",
                "end": "17:00",
                "category": "work",
                "location": "Office"
            }
        ],
        "Tuesday": [
            {
                "activity": "Gym",
                "start": "18:00",
                "end": "19:00",
                "category": "workout",
                "location": "Gym"
            }
        ]
    }
    
    # Sample stage4 data (aspirations)
    stage4_sample = {
        "aspirations": {
            "goals": ["Exercise more", "Read daily"],
            "lifestyle_changes": ["Better sleep schedule"],
            "activities_to_add": ["Meditation"],
            "activities_to_remove": ["Late night scrolling"]
        }
    }
    
    # Sample daily plan data
    daily_plan_sample = {
        "blocks": [
            {
                "start": "08:00",
                "end": "09:00",
                "name": "Morning Exercise",
                "category": "workout",
                "location": "Home"
            }
        ]
    }
    
    # Sample habit reformation data
    habit_reformation_sample = {
        "HIGHEST": [
            {
                "suggestion": "Start with 10-minute meditation daily",
                "reason": "Improves focus and reduces stress",
                "targets": "Meditation"
            }
        ],
        "HIGH": [
            {
                "suggestion": "Set phone to do not disturb at 10 PM",
                "reason": "Better sleep quality",
                "targets": "Better sleep schedule"
            }
        ]
    }
    
    # Sample weekly plan data
    weekly_plan_sample = {
        "Monday": [
            {
                "start": "09:00",
                "end": "17:00",
                "name": "Work",
                "category": "work",
                "location": "Office"
            }
        ]
    }
    
    print("Testing all storage functions...")
    
    # Test each function
    results = await asyncio.gather(
        store_stage3_response_json(user_id, timezone, stage3_sample, server_url),
        store_stage4_output_json(user_id, timezone, stage4_sample, server_url),
        store_today_plan_json(user_id, timezone, daily_plan_sample, server_url),
        store_tomorrow_plan_json(user_id, timezone, daily_plan_sample, server_url),
        store_habit_reformation_json(user_id, timezone, habit_reformation_sample, server_url),
        store_weekly_plan_json(user_id, timezone, weekly_plan_sample, server_url)
    )
    
    function_names = [
        "store_stage3_response_json",
        "store_stage4_output_json", 
        "store_today_plan_json",
        "store_tomorrow_plan_json",
        "store_habit_reformation_json",
        "store_weekly_plan_json"
    ]
    
    for i, result in enumerate(results):
        if result:
            print(f"✓ {function_names[i]}: Success!")
        else:
            print(f"✗ {function_names[i]}: Failed!")


# Run the test if this file is executed directly
if __name__ == "__main__":
    asyncio.run(test_all_functions()) 