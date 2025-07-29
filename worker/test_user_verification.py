import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv('.env', override=True)

async def test_user_verification():
    """Test the user verification functionality"""
    server_url = os.getenv('SERVER_URL', 'http://localhost:5005')
    
    # Test with a non-existent user ID
    print("Testing with non-existent user ID...")
    url = f"{server_url}/auth/verify-user/507f1f77bcf86cd799439011"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 404:
                    print("✓ Correctly identified non-existent user")
                else:
                    print(f"✗ Unexpected response for non-existent user: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")
    except Exception as e:
        print(f"✗ Error testing non-existent user: {str(e)}")
    
    # Test with an invalid user ID format
    print("\nTesting with invalid user ID format...")
    url = f"{server_url}/auth/verify-user/invalid-id"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 400:
                    print("✓ Correctly handled invalid user ID format")
                else:
                    print(f"✗ Unexpected response for invalid user ID: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")
    except Exception as e:
        print(f"✗ Error testing invalid user ID: {str(e)}")
    
    # Test with a valid user ID (you would need to create a user first)
    print("\nTesting with valid user ID...")
    print("Note: This test requires a valid user ID. You can create a user first using the test_api_client.py")
    
    # Example of how to test with a real user ID (uncomment and replace with actual ID)
    # valid_user_id = "your_actual_user_id_here"
    # url = f"{server_url}/auth/verify-user/{valid_user_id}"
    # 
    # try:
    #     async with aiohttp.ClientSession() as session:
    #         async with session.get(url) as response:
    #             if response.status == 200:
    #                 user_data = await response.json()
    #                 print(f"✓ User verified successfully: {user_data}")
    #             else:
    #                 print(f"✗ Unexpected response for valid user: {response.status}")
    #                 response_text = await response.text()
    #                 print(f"Response: {response_text}")
    # except Exception as e:
    #     print(f"✗ Error testing valid user: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_user_verification()) 