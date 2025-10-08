"""
Add test user support to database.
Part of dual-mode authentication architecture.
"""

import sqlite3
from pathlib import Path

# Use database in project root (where FastAPI expects it)
db_path = Path("../app.db")

if not db_path.exists():
    print("[ERROR] Database not found at ../app.db")
    print("Run this script from backend/ directory")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Adding test user support to database...")

# Check if column already exists
cursor.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cursor.fetchall()]

if "is_test_user" in columns:
    print("[SKIP] is_test_user column already exists")
else:
    # Add is_test_user column
    cursor.execute("ALTER TABLE users ADD COLUMN is_test_user BOOLEAN DEFAULT 0 NOT NULL")
    print("  [OK] Added is_test_user column")

    # Create index
    cursor.execute("CREATE INDEX idx_users_is_test_user ON users(is_test_user)")
    print("  [OK] Created index on is_test_user")

    # Create trigger to enforce @test.local domain for test users
    cursor.execute(
        """
        CREATE TRIGGER validate_test_user_email
        BEFORE INSERT ON users
        WHEN NEW.is_test_user = 1 AND NEW.email NOT LIKE '%@test.local'
        BEGIN
            SELECT RAISE(ABORT, 'Security: Test users must use @test.local domain');
        END
    """
    )
    print("  [OK] Created validation trigger for test users")

conn.commit()
conn.close()

print("\n[SUCCESS] Test user support added successfully!")
print("  - Column: is_test_user (BOOLEAN)")
print("  - Index: idx_users_is_test_user")
print("  - Trigger: validate_test_user_email")
print("\nNext: Run seed_test_users.py to create test users")
