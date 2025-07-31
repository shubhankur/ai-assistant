import aiohttp
import os

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5005')

async def api_get(path: str):
    url = f"{SERVER_URL.rstrip('/')}/{path.lstrip('/')}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            # Read the response data before closing the connection
            data = await resp.json()
            return resp, data

async def api_post(path: str, data: dict):
    url = f"{SERVER_URL.rstrip('/')}/{path.lstrip('/')}"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as resp:
            # Read the response data before closing the connection
            response_data = await resp.json()
            return resp, response_data

INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY', 'your-secret-internal-key')

async def api_post_internal(path: str, data: dict):
    """POST to the server's internal API endpoint using the internal API key."""
    url = f"{SERVER_URL.rstrip('/')}/internal/{path.lstrip('/')}"
    headers = {
        'Authorization': f'Bearer {INTERNAL_API_KEY}',
        'Content-Type': 'application/json',
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data, headers=headers) as resp:
            if resp.content_type == 'application/json':
                body = await resp.json()
            else:
                body = await resp.text()
            return resp, body
