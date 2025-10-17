"""
Test token refresh mechanism
Verifies that token refresh endpoint works correctly
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.auth import AuthService


def test_token_refresh():
    """Test token creation and refresh"""
    print("=== Testing Token Refresh Mechanism ===\n")

    auth_service = AuthService()

    # 1. Create test user data
    test_user = {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "role": "editor",
        "provider": "test",
    }

    print("1. Creating initial tokens...")
    tokens = auth_service.create_tokens(test_user)
    print(f"   Access token: {tokens['access_token'][:50]}...")
    print(f"   Refresh token: {tokens['refresh_token'][:50]}...")

    # 2. Verify access token
    print("\n2. Verifying access token...")
    try:
        payload = auth_service.verify_token(tokens["access_token"])
        print(f"   Token valid! User: {payload.get('email')}")
        print(f"   User ID: {payload.get('user_id')}")
        print(f"   Role: {payload.get('role')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

    # 3. Test refresh token
    print("\n3. Testing token refresh...")
    try:
        new_tokens = auth_service.refresh_tokens(tokens["refresh_token"])
        print(f"   New access token: {new_tokens['access_token'][:50]}...")
        print(f"   New refresh token: {new_tokens['refresh_token'][:50]}...")
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

    # 4. Verify new access token
    print("\n4. Verifying new access token...")
    try:
        payload = auth_service.verify_token(new_tokens["access_token"])
        print(f"   New token valid! User: {payload.get('email')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

    print("\n=== All Tests Passed! ===")
    return True


if __name__ == "__main__":
    success = test_token_refresh()
    sys.exit(0 if success else 1)
