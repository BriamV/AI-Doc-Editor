"""
Add users table to existing database.
Issue #27: User persistence and role management system

This script adds the users table without using Alembic to avoid
migration state complexity.
"""

import sqlite3
from pathlib import Path

db_path = Path("app.db")

if not db_path.exists():
    print("[ERROR] Database not found. Run simple_migrate.py first.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Adding users table...")

# Check if table already exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
if cursor.fetchone():
    print("[SKIP] users table already exists")
    conn.close()
    exit(0)

# Create users table
cursor.execute(
    """
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor' NOT NULL,
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at DATETIME
)
"""
)
print("  [OK] users table created")

# Create indexes for performance
cursor.execute("CREATE INDEX idx_users_email ON users(email)")
cursor.execute("CREATE INDEX idx_users_role ON users(role)")
cursor.execute("CREATE INDEX idx_users_provider ON users(provider)")
print("  [OK] indexes created")

# Create trigger to update updated_at timestamp
cursor.execute(
    """
CREATE TRIGGER update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END
"""
)
print("  [OK] timestamp trigger created")

conn.commit()
conn.close()

print("\n[SUCCESS] Users table added successfully!")
print("  - Table: users")
print("  - Indexes: email, role, provider")
print("  - Auto-update trigger: enabled")
