"""
User database service for authentication and role management
Issue #27: User persistence and role management system
"""

import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4


class UserService:
    """Service for managing user persistence in SQLite database."""

    def __init__(self, db_path: str = "app.db"):
        self.db_path = db_path

    def _get_connection(self):
        """Get database connection."""
        return sqlite3.connect(self.db_path)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address.

        Args:
            email: User email address

        Returns:
            User dict or None if not found
        """
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ? AND is_active = 1", (email,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return dict(row)
        return None

    def count_users(self) -> int:
        """
        Count total active users.

        Returns:
            Number of active users
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = 1")
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def create_user(
        self, email: str, name: str, provider: str, role: str = "editor"
    ) -> Dict[str, Any]:
        """
        Create a new user.

        Args:
            email: User email address
            name: User full name
            provider: OAuth provider ('google' or 'microsoft')
            role: User role ('editor' or 'admin')

        Returns:
            Created user dict
        """
        user_id = str(uuid4())
        now = datetime.utcnow().isoformat()

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users (id, email, name, provider, role, is_active, created_at, updated_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
            """,
            (user_id, email, name, provider, role, now, now, now),
        )
        conn.commit()
        conn.close()

        return {
            "id": user_id,
            "email": email,
            "name": name,
            "provider": provider,
            "role": role,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "last_login_at": now,
        }

    def update_last_login(self, user_id: str) -> None:
        """
        Update user's last login timestamp.

        Args:
            user_id: User ID
        """
        now = datetime.utcnow().isoformat()

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, user_id))
        conn.commit()
        conn.close()

    def update_user_role(self, email: str, role: str) -> bool:
        """
        Update user's role.

        Args:
            email: User email address
            role: New role ('editor' or 'admin')

        Returns:
            True if updated, False if user not found
        """
        if role not in ["editor", "admin"]:
            raise ValueError(f"Invalid role: {role}. Must be 'editor' or 'admin'")

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE users SET role = ? WHERE email = ? AND is_active = 1", (role, email))
        updated = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return updated

    def get_or_create_user(self, email: str, name: str, provider: str) -> Dict[str, Any]:
        """
        Get existing user or create new one.
        First user automatically becomes admin.

        Args:
            email: User email address
            name: User full name
            provider: OAuth provider

        Returns:
            User dict
        """
        # Try to get existing user
        user = self.get_user_by_email(email)

        if user:
            # Update last login
            self.update_last_login(user["id"])
            return user

        # Create new user
        # First user becomes admin
        is_first_user = self.count_users() == 0
        role = "admin" if is_first_user else "editor"

        return self.create_user(email, name, provider, role)
