# User Management and Role System

**Related**: Issue #27 - User persistence and role management system

## Overview

The application implements a role-based access control (RBAC) system with two roles:
- **Editor**: Standard user with basic permissions
- **Admin**: Administrative user with full system access

## User Persistence

Users are persisted in the SQLite database after OAuth authentication:

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL,        -- 'google' or 'microsoft'
    role VARCHAR(20) DEFAULT 'editor' NOT NULL,  -- 'editor' or 'admin'
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at DATETIME
);
```

## Authentication Flow

1. User initiates OAuth login (Google or Microsoft)
2. After successful OAuth, backend checks if user exists in database
3. **If user exists**: Update `last_login_at` timestamp
4. **If new user**: Create user record with appropriate role
   - **First user ever**: Automatically assigned `admin` role
   - **Subsequent users**: Assigned `editor` role by default
5. Generate JWT token with user's current role from database

## Role Management

### Automatic Admin Assignment

The first user to register automatically becomes an admin:

```python
# app/services/user_service.py
is_first_user = self.count_users() == 0
role = "admin" if is_first_user else "editor"
```

### Manual Role Promotion

Use the admin promotion script to change user roles:

```bash
# Promote user to admin
python scripts/promote_admin.py user@example.com

# Demote admin to editor
python scripts/promote_admin.py user@example.com --demote
```

### List All Users

View all registered users:

```bash
python scripts/list_users.py
```

Output example:
```
Total users: 3

Email                               Name                      Role       Provider     Status   Last Login
------------------------------------------------------------------------------------------------------------------------
admin@example.com                   John Admin                admin      google       Active   2025-01-08 17:00:00
editor1@example.com                 Jane Editor               editor     microsoft    Active   2025-01-08 16:45:00
editor2@example.com                 Bob Smith                 editor     google       Active   2025-01-08 15:30:00
```

## User Service API

The `UserService` class provides the following methods:

### `get_user_by_email(email: str) -> Optional[Dict]`
Retrieve user by email address.

### `count_users() -> int`
Count total active users.

### `create_user(email, name, provider, role="editor") -> Dict`
Create a new user.

### `update_last_login(user_id: str) -> None`
Update user's last login timestamp.

### `update_user_role(email: str, role: str) -> bool`
Change user's role (editor ↔ admin).

### `get_or_create_user(email, name, provider) -> Dict`
Get existing user or create new one. Implements "first user = admin" logic.

## Database Setup

### Initial Setup

If starting fresh, run migrations:

```bash
cd backend

# Create base tables (audit_logs, system_configurations)
python simple_migrate.py

# Add users table
python add_users_table.py
```

### Verify Setup

```bash
# Check all database tables
python check_db.py

# List users (should be empty initially)
python scripts/list_users.py
```

## Security Considerations

1. **JWT Tokens**: User role is embedded in JWT token
   - Role changes require new login to get updated token
   - Tokens expire based on `ACCESS_TOKEN_EXPIRE_MINUTES` setting

2. **First User Protection**: Only the very first registered user becomes admin
   - Subsequent users always start as editor
   - Must be manually promoted by existing admin

3. **Role Validation**: Only two valid roles: `editor` and `admin`
   - Enforced at database and application level

4. **Audit Trail**: User creation and login times tracked
   - `created_at`: When user first registered
   - `last_login_at`: Most recent authentication
   - `updated_at`: Last time user record was modified

## Testing

### Test First User Admin Assignment

1. Ensure database has no users: `python scripts/list_users.py`
2. Login with OAuth (will become admin automatically)
3. Verify role: `python scripts/list_users.py` should show `admin`

### Test Subsequent User Editor Assignment

1. Login with different OAuth account
2. Verify role: `python scripts/list_users.py` should show `editor`

### Test Role Promotion

```bash
# Promote editor to admin
python scripts/promote_admin.py editor@example.com

# Verify change
python scripts/list_users.py
```

## Future Enhancements

- [ ] Admin UI for user management
- [ ] Role-based endpoint protection middleware
- [ ] User deactivation/deletion
- [ ] Additional roles (viewer, contributor, etc.)
- [ ] Permission-based access control (PBAC)
- [ ] Audit log integration for role changes

## Related Files

- **Model**: `app/models/user.py` - SQLAlchemy User model
- **Service**: `app/services/user_service.py` - User database operations
- **Router**: `app/routers/auth.py` - OAuth callback integration
- **Scripts**:
  - `add_users_table.py` - Create users table migration
  - `scripts/promote_admin.py` - Role management
  - `scripts/list_users.py` - User listing utility
