import aiohttp
import os

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5005')

async def api_get(path: str):
    url = f"{SERVER_URL.rstrip('/')}/{path.lstrip('/')}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return resp

async def api_post(path: str, data: dict):
    url = f"{SERVER_URL.rstrip('/')}/{path.lstrip('/')}"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as resp:
            return resp
