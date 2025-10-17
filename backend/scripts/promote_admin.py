"""
Promote user to admin role.
Issue #27: User persistence and role management system

Usage:
    python scripts/promote_admin.py user@example.com
    python scripts/promote_admin.py user@example.com --demote  # Demote to editor
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.user_service import UserService


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/promote_admin.py <email> [--demote]")
        print("\nExamples:")
        print("  python scripts/promote_admin.py user@example.com")
        print("  python scripts/promote_admin.py user@example.com --demote")
        sys.exit(1)

    email = sys.argv[1]
    is_demotion = "--demote" in sys.argv

    target_role = "editor" if is_demotion else "admin"
    action = "Demoting" if is_demotion else "Promoting"

    user_service = UserService()

    # Check if user exists
    user = user_service.get_user_by_email(email)
    if not user:
        print(f"[ERROR] User not found: {email}")
        print("\nAvailable users:")
        # This would require a list_users method, but for now just error
        sys.exit(1)

    # Check if already has target role
    if user["role"] == target_role:
        print(f"[INFO] User {email} already has role '{target_role}'")
        sys.exit(0)

    # Update role
    print(f"{action} user {email} from '{user['role']}' to '{target_role}'...")
    success = user_service.update_user_role(email, target_role)

    if success:
        print(f"[SUCCESS] User {email} is now {target_role}")
    else:
        print("[ERROR] Failed to update user role")
        sys.exit(1)


if __name__ == "__main__":
    main()
