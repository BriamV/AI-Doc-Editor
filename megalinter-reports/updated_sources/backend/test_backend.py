#!/usr/bin/env python3
"""
Test script for T-02 OAuth + JWT backend
Quick verification without Docker dependency
"""
import sys
import os

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))


def test_auth_service():
    """Test JWT token generation"""
    print("🧪 Testing AuthService...")

    try:
        from app.services.auth import AuthService

        auth_service = AuthService()

        # Test user data
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "role": "editor",
            "provider": "google",
        }

        # Create tokens
        tokens = auth_service.create_tokens(user_data)
        print(f"✅ Tokens created: {len(tokens)} tokens")

        # Verify access token
        payload = auth_service.verify_token(tokens["access_token"])
        print(f"✅ Token verified: {payload['email']}, role: {payload['role']}")

        return True

    except Exception as e:
        print(f"❌ AuthService test failed: {e}")
        return False


def test_config():
    """Test configuration loading"""
    print("🧪 Testing Configuration...")

    try:
        from app.core.config import settings

        print(f"✅ App Name: {settings.APP_NAME}")
        print(f"✅ Debug Mode: {settings.DEBUG}")
        print(f"✅ Frontend URL: {settings.FRONTEND_URL}")
        print(f"✅ JWT Algorithm: {settings.ALGORITHM}")

        return True

    except Exception as e:
        print(f"❌ Config test failed: {e}")
        return False


def test_models():
    """Test Pydantic models"""
    print("🧪 Testing Models...")

    try:
        from app.models.auth import UserCreate, TokenResponse

        # Test user creation model
        user = UserCreate(email="test@example.com", name="Test User", provider="google")
        print(f"✅ User model: {user.email}, role: {user.role}")

        return True

    except Exception as e:
        print(f"❌ Models test failed: {e}")
        return False


def test_config_service():
    """Test ConfigService CRUD operations."""
    print("🧪 Testing ConfigService...")

    try:
        import asyncio
        from app.db.session import AsyncSessionLocal
        from app.services.config import ConfigService

        async def run_test() -> bool:
            async with AsyncSessionLocal() as session:
                service = ConfigService(session)
                await service.upsert("test_key", "test_value")
                data = await service.get_all()
                return any(
                    entry.key == "test_key" and entry.value == "test_value" for entry in data
                )

        result = asyncio.run(run_test())
        if result:
            print("✅ ConfigService upsert works")
            return True
        print("❌ ConfigService upsert failed")
        return False
    except Exception as e:
        print(f"❌ ConfigService test failed: {e}")
        return False


def main():
    print("🚀 T-02 Backend Testing")
    print("=" * 40)

    tests = [
        test_config,
        test_models,
        test_auth_service,
        test_config_service,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print(f"📊 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All tests passed! T-02 backend implementation is working")
        return True
    else:
        print("⚠️ Some tests failed. Check implementation.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
