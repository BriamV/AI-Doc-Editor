"""
Generate JWT token for performance testing without OAuth flow.

This script creates a test user in the database and generates a valid JWT token
that can be used for Locust performance benchmarks.

Usage:
    python backend/tests/performance/get_test_token.py

    # Optional: Specify test user email
    python backend/tests/performance/get_test_token.py --email test@example.com

    # Export token directly to environment variable (PowerShell)
    $env:TEST_AUTH_TOKEN = $(python backend/tests/performance/get_test_token.py --quiet)

Environment Variables:
    - Uses .env file configuration automatically
    - No manual OAuth flow required
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.auth import AuthService
from app.services.user_service import UserService


async def create_test_user_and_token(email: str = "test@example.com", name: str = "Test User"):
    """
    Create or get test user and generate JWT token.

    Args:
        email: Test user email
        name: Test user name

    Returns:
        dict: Contains access_token, refresh_token, and user info
    """
    # Initialize services
    user_service = UserService()
    auth_service = AuthService()

    # Create or get test user
    print(f"Creating/fetching test user: {email}", file=sys.stderr)
    user = user_service.get_or_create_user(
        email=email,
        name=name,
        provider="test",  # Special provider for test users
    )

    # Prepare user data for JWT
    user_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "provider": user["provider"],
        "role": user.get("role", "editor"),  # Default to editor role
    }

    print(f"User ID: {user['id']}", file=sys.stderr)
    print(f"User Role: {user_data['role']}", file=sys.stderr)

    # Generate JWT tokens
    print("Generating JWT tokens...", file=sys.stderr)
    tokens = auth_service.create_tokens(user_data)

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "user": user_data,
    }


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate JWT token for performance testing"
    )
    parser.add_argument(
        "--email",
        default="test-performance@example.com",
        help="Test user email (default: test-performance@example.com)",
    )
    parser.add_argument(
        "--name",
        default="Performance Test User",
        help="Test user name (default: Performance Test User)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Output only the token (for scripting)",
    )

    args = parser.parse_args()

    # Run async function
    result = asyncio.run(create_test_user_and_token(args.email, args.name))

    if args.quiet:
        # Output only token for scripting
        print(result["access_token"])
    else:
        # Output full information
        print("\n" + "=" * 70)
        print("JWT TOKEN GENERATED SUCCESSFULLY")
        print("=" * 70)
        print(f"\nUser Email: {result['user']['email']}")
        print(f"User ID: {result['user']['id']}")
        print(f"User Role: {result['user']['role']}")
        print(f"\nAccess Token:\n{result['access_token']}")
        print(f"\nRefresh Token:\n{result['refresh_token']}")
        print("\n" + "=" * 70)
        print("USAGE INSTRUCTIONS")
        print("=" * 70)
        print("\nWindows PowerShell:")
        print(f'$env:TEST_AUTH_TOKEN="{result["access_token"]}"')
        print("\nLinux/Mac:")
        print(f'export TEST_AUTH_TOKEN="{result["access_token"]}"')
        print("\nOr add to .env file:")
        print(f'TEST_AUTH_TOKEN={result["access_token"]}')
        print("\n" + "=" * 70)

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nCancelled by user", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {str(e)}", file=sys.stderr)
        sys.exit(1)
