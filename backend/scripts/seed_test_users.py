"""
Seed test users for development authentication.
Part of dual-mode authentication architecture.

Creates 3 test users:
- admin@test.local (admin role)
- editor@test.local (editor role)
- viewer@test.local (editor role)

Usage:
    python scripts/seed_test_users.py
    python scripts/seed_test_users.py --reset  # Delete and recreate
"""

import sys
import sqlite3
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Use database in project root
DB_PATH = Path(__file__).parent.parent.parent / "app.db"

# Test users configuration
TEST_USERS = [
    {
        "email": "admin@test.local",
        "name": "Admin Test User",
        "role": "admin",
        "provider": "test",
    },
    {
        "email": "editor@test.local",
        "name": "Editor Test User",
        "role": "editor",
        "provider": "test",
    },
    {
        "email": "viewer@test.local",
        "name": "Viewer Test User",
        "role": "editor",
        "provider": "test",
    },
]


def seed_test_users(reset=False):
    """Seed test users into database."""

    if not DB_PATH.exists():
        print(f"[ERROR] Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if "is_test_user" not in columns:
        print("[ERROR] is_test_user column not found in users table")
        print("Run: python add_test_users_support.py first")
        conn.close()
        sys.exit(1)

    if reset:
        # Delete existing test users
        cursor.execute("DELETE FROM users WHERE is_test_user = 1")
        deleted = cursor.rowcount
        if deleted > 0:
            print(f"[RESET] Deleted {deleted} existing test user(s)")

    # Check existing test users
    cursor.execute("SELECT email FROM users WHERE is_test_user = 1")
    existing_emails = {row[0] for row in cursor.fetchall()}

    created_count = 0
    skipped_count = 0

    for user in TEST_USERS:
        if user["email"] in existing_emails:
            print(f"[SKIP] {user['email']} already exists")
            skipped_count += 1
            continue

        user_id = str(uuid4())
        now = datetime.utcnow().isoformat()

        cursor.execute(
            """
            INSERT INTO users (
                id, email, name, provider, role, is_active, is_test_user,
                created_at, updated_at, last_login_at
            ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, NULL)
            """,
            (user_id, user["email"], user["name"], user["provider"], user["role"], now, now),
        )
        print(f"[CREATE] {user['email']} ({user['role']})")
        created_count += 1

    conn.commit()
    conn.close()

    print("\n[SUCCESS] Test users seeded!")
    print(f"  - Created: {created_count}")
    print(f"  - Skipped: {skipped_count}")
    print(f"  - Total: {len(TEST_USERS)}")

    if created_count > 0:
        print("\n=== Test Users Available ===")
        for user in TEST_USERS:
            print(f"  • {user['email']} - Role: {user['role']}")

        print("\nUse these in test login endpoint:")
        print("  POST /api/auth/test/login")
        print('  Body: {"email": "admin@test.local"}')


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed_test_users(reset=reset)
