"""
List all users in the database.
Issue #27: User persistence and role management system

Usage:
    python scripts/list_users.py
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3


def main():
    db_path = Path(__file__).parent.parent / "app.db"

    if not db_path.exists():
        print("[ERROR] Database not found. Run migrations first.")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("[ERROR] Users table not found. Run add_users_table.py first.")
        sys.exit(1)

    # Get all users
    cursor.execute(
        """
        SELECT email, name, provider, role, is_active, created_at, last_login_at
        FROM users
        ORDER BY created_at ASC
    """
    )
    users = cursor.fetchall()

    if not users:
        print("No users found in database.")
        print("\nNote: First user to log in will automatically become admin.")
        conn.close()
        return

    print(f"\nTotal users: {len(users)}\n")
    print(f"{'Email':<35} {'Name':<25} {'Role':<10} {'Provider':<12} {'Status':<8} {'Last Login'}")
    print("-" * 120)

    for user in users:
        status = "Active" if user["is_active"] else "Inactive"
        last_login = user["last_login_at"] or "Never"
        if last_login != "Never":
            # Format datetime to be more readable
            last_login = last_login[:19]  # Remove microseconds

        print(
            f"{user['email']:<35} "
            f"{user['name']:<25} "
            f"{user['role']:<10} "
            f"{user['provider']:<12} "
            f"{status:<8} "
            f"{last_login}"
        )

    conn.close()

    print("\n" + "=" * 120)
    print("\nTo promote a user to admin:")
    print("  python scripts/promote_admin.py <email>")
    print("\nTo demote an admin to editor:")
    print("  python scripts/promote_admin.py <email> --demote")


if __name__ == "__main__":
    main()
