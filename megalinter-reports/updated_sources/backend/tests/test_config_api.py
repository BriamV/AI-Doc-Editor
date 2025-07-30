from fastapi.testclient import TestClient

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.db.session import AsyncSessionLocal
import asyncio
from app.services.config import ConfigService

client = TestClient(app)


def setup_module(module):
    # Ensure DB is empty
    async def clear():
        async with AsyncSessionLocal() as session:
            await session.execute("DELETE FROM system_configurations")
            await session.commit()

    asyncio.run(clear())


def test_get_empty_config():
    resp = client.get("/api/config")
    assert resp.status_code == 200
    assert resp.json() == []


def test_set_and_get_config():
    resp = client.post("/api/config", json={"key": "site_name", "value": "AI Doc"})
    assert resp.status_code == 200
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert any(item["key"] == "site_name" and item["value"] == "AI Doc" for item in data)
